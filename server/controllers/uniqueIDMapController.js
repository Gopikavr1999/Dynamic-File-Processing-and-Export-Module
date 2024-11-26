const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

const uniqueIDMapController = async (req, res) => {
    try {
        const file = "Shriram General Insurance_Bike";
        const keyName = "SHRIRAM_BIKE_ID"; // Key to search for in documents
        const P4USMaster = "P4US_Bike"; 
        const backend = "backend_bikes"; 

        const fileCollection = mongoose.connection.collection(file); // Collection from file
        const backendCollection = mongoose.connection.collection(backend); // Backend collection
        
        // Find all documents in the file collection
        const fileDocuments = await fileCollection.find({}).toArray();
        console.log("File Documents:", fileDocuments);

        // Extract BA_ID values from the file collection documents
        const keyValues = fileDocuments.map(doc => doc[keyName]);
        console.log("Extracted key values (RG_ID):", keyValues);

        
        // Process each keyValue separately
        for (const keyValue of keyValues) {
            // Find matching documents in the backend collection for the current keyValue
            const matchingDocuments = await backendCollection.find({
                content: keyValue // Check if content matches the current BA_ID
            }).toArray();

            console.log(`Matching Backend Documents for ${keyValue}:`, JSON.stringify(matchingDocuments, null, 2));

            for (const doc of matchingDocuments) {
                const crossRefRelation = doc.relation.find(rel => rel.relationType === "Cross Reference");
                console.log("crossRefRelation",crossRefRelation);
                
                if (crossRefRelation) {
                    // Fetch documents for each relatedTo item
                    const relatedDocuments = await Promise.all(
                        crossRefRelation.relatedTo.map(async (relatedId) => {
                            try {
                                return await backendCollection.findOne({ _id: new ObjectId(relatedId) });
                            } catch (err) {
                                console.error(`Error fetching related document for ID ${relatedId}:`, err);
                                return null;
                            }
                        })
                    );
                    console.log("relatedDocuments",relatedDocuments);
                    

                    // Filter out any null results (in case documents were not found)
                    const validRelatedDocuments = relatedDocuments.filter(doc => doc !== null);
                    console.log("validRelatedDocuments",validRelatedDocuments);
                    
                    // Collect all content values with 'P4US_Car-dummy' in the File Connection relation
                    const p4usContents = [];

                    for (const relatedDoc of validRelatedDocuments) {
                        const fileConnectionRelation = relatedDoc.relation.find(rel => rel.relationType === "File Connection");

                        if (fileConnectionRelation && fileConnectionRelation.relatedTo.includes(P4USMaster)) {
                            // Collect the content of the related document
                            p4usContents.push(relatedDoc.content);
                        }
                    }

                    // If any P4US contents were found, update the original document
                    if (p4usContents.length > 0) {
                        // Update the original file collection document with the array of P4US_ID values
                        await fileCollection.updateOne(
                            { [keyName]: keyValue }, // Find the document by keyValue
                            { $set: { P4US_ID: p4usContents } } // Set the P4US_ID to the array of content values
                        );

                        console.log(`Updated document with keyValue: ${keyValue}, P4US_ID: ${JSON.stringify(p4usContents)}`);
                    }
                }
            }
                        
        }
        console.log("P4US_ID added successfully....");
        

        // Optionally send the response back
        res.status(200).json("allResults");
        
    } catch (error) {
        console.error("Error in uniqueIDMapController:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { uniqueIDMapController };
