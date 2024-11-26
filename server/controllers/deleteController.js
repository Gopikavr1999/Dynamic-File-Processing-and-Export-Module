const createBackendModel = require("../models/backendModel");

const deleteController = async (req,res) => {
    try {
        const {fileName} = req.body;
        console.log("fileName",fileName);
        
        // Define the collections you want to search in
        const collections = ["Backend_Cars", "Backend_Bikes"];
        
        // Initialize an empty array to hold results
        const foundCollections = [];

        // Iterate over the collections to find documents with the relatedTo array containing the fileName
        for (const collectionName of collections) {
            const Collection = createBackendModel(collectionName);
            const foundDocument = await Collection.findOne({
                "relation": {
                $elemMatch: {
                    relationType: "File Connection",
                    relatedTo: fileName
                }
                }
            });

            if (foundDocument) {
                foundCollections.push(collectionName); // Add the collection name to the results if a document is found
            }
        }
        console.log("foundCollections",foundCollections);

        const Backend = createBackendModel(foundCollections)

          // Step 1: Find documents with the specified fileName in File Connection relationType
          const documents = await Backend.find({
            'relation': {
                $elemMatch: {
                    relationType: 'File Connection',
                    relatedTo: fileName
                }
            }
        });       

        // Step 2: Prepare to track ids of deleted documents
        const idsToDelete = [];

        for (const doc of documents) {
            const fileConnection = doc.relation.find(r => r.relationType === 'File Connection');
            if (fileConnection) {
                const relatedTo = fileConnection.relatedTo;
                if (relatedTo.length === 1 && relatedTo[0] === fileName) {
                    // If only the fileName is present, schedule document for deletion
                    idsToDelete.push(doc._id);
                } else {
                    // Remove only the fileName from the relatedTo array
                    const updatedRelatedTo = relatedTo.filter(item => item !== fileName);
                    await Backend.updateOne(
                        { _id: doc._id },
                        { $set: { 'relation.$[elem].relatedTo': updatedRelatedTo } },
                        { arrayFilters: [{ 'elem.relationType': 'File Connection' }] }
                    );
                }
            }
        }

        // Step 3: Remove scheduled documents if any
        if (idsToDelete.length > 0) {
            await Backend.deleteMany({ _id: { $in: idsToDelete } });
            console.log(`Deleted documents with IDs: ${idsToDelete}`);
        }

        // Step 4: Remove the IDs from relatedTo arrays in other documents
        if (idsToDelete.length > 0) {
            await Backend.updateMany(
                { 'relation.relatedTo': { $in: idsToDelete } },
                { $pull: { 'relation.$[].relatedTo': { $in: idsToDelete } } }
            );
            console.log(`Removed IDs from relatedTo arrays for deleted documents.`);
        }

        return { success: true, message: 'Delete operation completed successfully.' };

        
    } catch (error) {
        console.log("Error",error);
        
    }
}

module.exports = {deleteController}