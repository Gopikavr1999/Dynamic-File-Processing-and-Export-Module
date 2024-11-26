const createBackendModel = require("../models/backendModel");

const BATCH_SIZE = 100;

const headerRelationController = async (headers, rows, backend) => {
    try {
        const Backend = createBackendModel(backend);

        // Map headers to their index
        const headerMap = headers.reduce((map, header, index) => {
            map[header] = index;
            return map;
        }, {});

        // Fetch existing header documents
        const allHeaderDocs = await Backend.find({ content: { $in: headers } });
        const headerDocMap = allHeaderDocs.reduce((map, doc) => {
            map[doc.content] = doc;
            return map;
        }, {});
        console.log("headerDocMap", headerDocMap);

        // Split rows into batches
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const rowBatch = rows.slice(i, i + BATCH_SIZE);

            // Prepare bulk operations
            const bulkOperations = [];

            for (const row of rowBatch) {
                const columns = row.split(',').map(col => col.trim());

                for (const [header, index] of Object.entries(headerMap)) {
                    const contentValue = columns[index];
                    if (!contentValue) continue;

                    const headerDoc = headerDocMap[header];

                    if (headerDoc) {
                        // Check if a document with the content value exists
                        const contentDoc = await Backend.findOne({ content: contentValue });
                        if (contentDoc && contentDoc._id.toString() !== headerDoc._id.toString()) {
                            const existingRelation = contentDoc.relation?.find(rel => rel.relationType === 'Header Connection');

                            if (existingRelation) {
                                // Add the header ID to the `relatedTo` array if it already exists
                                console.log("bulkOperations ready to update");

                                bulkOperations.push({
                                    updateOne: {
                                        filter: { _id: contentDoc._id, 'relation.relationType': 'Header Connection' },
                                        update: { $addToSet: { 'relation.$.relatedTo': headerDoc._id.toString() } }
                                    }
                                });
                            }
                        }
                    }
                }
            }
            console.log("Bulk updates ready for Header Connections");

            // // Execute bulk operations if there are any
            // if (bulkOperations.length > 0) {
            //     await Backend.bulkWrite(bulkOperations);
            //     console.log("Bulk updates completed for Header Connections");
            // } else {
            //     console.log("No updates required for Header Connections");
            // }

            // Execute bulk operations for each batch
            if (bulkOperations.length > 0) {
                await Backend.bulkWrite(bulkOperations);
                console.log(`Batch ${i / BATCH_SIZE + 1} completed for Header Connections`);
            } else {
                console.log(`No updates required for Batch ${i / BATCH_SIZE + 1}`);
            }
        }

        console.log("All batches processed for Header Connections");

    } catch (error) {
        console.error("Error in headerRelationController:", error);
        throw error;
    }
};

module.exports = { headerRelationController };
