const createBackendModel = require("../models/backendModel");

const crossReferenceController = async (allDocs, uniqueIDDocs, backend) => {
    try {
        console.log("uniqueIDDocs",uniqueIDDocs);
        
        // Process each lastTerm document separately to handle headerConnection individually
        uniqueIDDocs.forEach(doc => {
            console.log("doc",doc);
            
            // Get the related Unique IDs for the current UniqueIDDoc
            const uniqueIDConnection = doc.relation.find(rel => rel.relationType === "Unique ID Connection");           
            
            if (uniqueIDConnection) {
                console.log("Processing uniqueIDConnection:", uniqueIDConnection);

                // Find documents corresponding to the related IDs of the current uniqueIDConnection
                const relatedDocs = allDocs.filter(d => uniqueIDConnection.relatedTo.includes(d._id.toString()));
                console.log("Matching Documents by Related IDs for this uniqueIDConnection:", relatedDocs);

                // For each of these relatedDocs, find their own "Unique ID Connection" related IDs
                let relatedDocsIds = [];
                relatedDocs.forEach(relatedDoc => {
                    const relatedDocHeaderConnection = relatedDoc.relation.find(rel => rel.relationType === "Unique ID Connection");
                    console.log("relatedDocHeaderConnection",relatedDocHeaderConnection);
                    relatedDocsIds.push(relatedDocHeaderConnection.relatedTo)
                });   
                console.log("relatedDocsIds",relatedDocsIds);
                          
                 // Find common IDs based on the 55% occurrence threshold
                 const commonIds = findCommonIds(relatedDocsIds, 55);
                 console.log('Common IDs:', commonIds);

                if (commonIds.length > 0) {
                    // Remove the document's own _id from commonIds if it is present
                    const filteredCommonIds = commonIds.filter(id => id !== doc._id.toString());
                    console.log("filteredCommonIds",filteredCommonIds);
                    

                    if (filteredCommonIds.length === 0) {
                        console.log(`Skipping update for document ${doc._id} as no other common IDs are left.`);
                        return; // Skip this document if no common IDs are left after filtering
                    } else {
                        console.log(`Filtered common IDs for document ${doc._id}:`, filteredCommonIds);
                    }

                    // Check if the "Cross Reference" relationType already exists in the document
                    const crossReferenceRelation = doc.relation.find(rel => rel.relationType === "Cross Reference");

                    if (crossReferenceRelation) {
                        // If it exists, check which commonIds are not in the relatedTo array
                        const newCommonIds = filteredCommonIds.filter(id => !crossReferenceRelation.relatedTo.includes(id));

                        if (newCommonIds.length > 0) {
                            // If there are new common IDs, push them into relatedTo
                            crossReferenceRelation.relatedTo.push(...newCommonIds);
                            console.log(`Updated "Cross Reference" relation for document ${doc._id} with new common IDs:`, newCommonIds);
                        } else {
                            console.log(`All common IDs already exist in "Cross Reference" relation for document ${doc._id}. No update needed.`);
                        }
                    } else {
                        // If "Cross Reference" relation does not exist, create a new one
                        const newCrossReferenceRelation = {
                            relationType: "Cross Reference",
                            relatedTo: filteredCommonIds
                        };
                        doc.relation = doc.relation || [];
                        doc.relation.push(newCrossReferenceRelation);
                        console.log(`Added new "Cross Reference" relation for document ${doc._id} with common IDs:`, commonIds);
                    }
                }
            }
        });
       
         // Save updated documents back to the database
         await saveUpdatedDocuments(uniqueIDDocs, backend);

    } catch (error) {
        console.error("Error in crossReferenceController:", error);
        throw error;
    }
};

function findCommonIds(relatedDocsIds, percentage = 55) {
    // Flatten the array of arrays and count occurrences of each ID
    const idCountMap = new Map();
    relatedDocsIds.flat().forEach(id => {
        idCountMap.set(id, (idCountMap.get(id) || 0) + 1);
    });
  
    // Calculate the threshold based on the percentage
    const threshold = Math.ceil((percentage / 100) * relatedDocsIds.length);
  
    // Filter IDs based on the threshold
    const commonIds = [...idCountMap.entries()]
        .filter(([id, count]) => count >= threshold)
        .map(([id]) => id);
  
    return commonIds;
}


  // Function to update documents in the database
async function saveUpdatedDocuments(docsToUpdate, backend) {
    const Backend = createBackendModel(backend);

    // Iterate over each document to update
    for (const doc of docsToUpdate) {
        try {
            // Assuming `_id` is the unique identifier and `updateOne` is used
            await Backend.updateOne(
                { _id: doc._id }, // Filter criteria to find the document
                { $set: { relation: doc.relation } } // Update the `relation` field
            );
        } catch (error) {
            console.error(`Error updating document with ID ${doc._id}:`, error);
        }
    }
}
module.exports = { crossReferenceController };