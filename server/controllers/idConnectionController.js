const createBackendModel = require("../models/backendModel");

const idConnectionController = async (allDocuments, lastTerms, backend) => {
    try {
        const Backend = createBackendModel(backend);

        // Create a map for quick lookup of documents by their content
        const contentToDocMap = allDocuments.reduce((map, doc) => {
            map[doc.content] = doc;
            return map;
        }, {});

        const bulkOps = [];

        // Iterate over each document in allDocuments
        for (const document of allDocuments) {
            const relatedIds = new Set();

            // Check if the content of the current document is included in any of the strings in lastTerms
            for (const term of lastTerms) {
                if (term.includes(document.content)) {
                    const matchingDocument = contentToDocMap[term];
                    if (matchingDocument && matchingDocument._id.toString() !== document._id.toString()) {
                        relatedIds.add(matchingDocument._id.toString());
                    }
                }
            }

            // Only proceed if there are related IDs
            if (relatedIds.size > 0) {
                const relatedIdsArray = Array.from(relatedIds);

                // Update the original document's "Unique ID Connection" if it exists
                bulkOps.push({
                    updateOne: {
                        filter: { _id: document._id, "relation.relationType": "Unique ID Connection" },
                        update: { $addToSet: { "relation.$.relatedTo": { $each: relatedIdsArray } } },
                    }
                });

                // Create a new "Unique ID Connection" relation if it doesn't exist
                bulkOps.push({
                    updateOne: {
                        filter: { _id: document._id, "relation.relationType": { $ne: "Unique ID Connection" } },
                        update: {
                            $addToSet: {
                                relation: {
                                    relationType: "Unique ID Connection",
                                    relatedTo: relatedIdsArray,
                                },
                            },
                        }
                    }
                });

                // Update all related documents with the _id of the original document
                relatedIdsArray.forEach(relatedId => {
                    // Update related document if "Unique ID Connection" exists
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: relatedId, "relation.relationType": "Unique ID Connection" },
                            update: { $addToSet: { "relation.$.relatedTo": document._id.toString() } },
                        }
                    });

                    // Create a new "Unique ID Connection" relation if it doesn't exist
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: relatedId, "relation.relationType": { $ne: "Unique ID Connection" } },
                            update: {
                                $addToSet: {
                                    relation: {
                                        relationType: "Unique ID Connection",
                                        relatedTo: [document._id.toString()],
                                    },
                                },
                            }
                        }
                    });
                });

                console.log(`Document with content "${document.content}" updated with relations to "${relatedIdsArray.join(', ')}"`);
            } else {
                console.log(`No match for content: ${document.content}`);
            }
        }

        // Perform bulk write operations
        if (bulkOps.length > 0) {
            await Backend.bulkWrite(bulkOps);
        }

        console.log("idConnection completed");
    } catch (error) {
        console.error("Error in idConnectionController:", error);
    }
};

module.exports = { idConnectionController };
// const createBackendModel = require("../models/backendModel");

// const idConnectionController = async (allDocuments, lastTerms, backend) => {
//     try {
//         const Backend = createBackendModel(backend);

//         // Create a map for quick lookup of documents by their content
//         const contentToDocMap = allDocuments.reduce((map, doc) => {
//             map[doc.content] = doc;
//             return map;
//         }, {});

//         const bulkOps = [];
//         const BATCH_SIZE = 1000; // Set batch size for bulk operations

//         // Iterate over each document in allDocuments
//         for (const document of allDocuments) {
//             const relatedIds = new Set();

//             // Check if the content of the current document is included in any of the strings in lastTerms
//             for (const term of lastTerms) {
//                 if (term.includes(document.content)) {
//                     const matchingDocument = contentToDocMap[term];
//                     if (matchingDocument && matchingDocument._id.toString() !== document._id.toString()) {
//                         relatedIds.add(matchingDocument._id.toString());
//                     }
//                 }
//             }

//             // Only proceed if there are related IDs
//             if (relatedIds.size > 0) {
//                 const relatedIdsArray = Array.from(relatedIds);

//                 // Update the original document's "Unique ID Connection" if it exists
//                 bulkOps.push({
//                     updateOne: {
//                         filter: { _id: document._id, "relation.relationType": "Unique ID Connection" },
//                         update: { $addToSet: { "relation.$.relatedTo": { $each: relatedIdsArray } } },
//                     }
//                 });

//                 // Create a new "Unique ID Connection" relation if it doesn't exist
//                 bulkOps.push({
//                     updateOne: {
//                         filter: { _id: document._id, "relation.relationType": { $ne: "Unique ID Connection" } },
//                         update: {
//                             $addToSet: {
//                                 relation: {
//                                     relationType: "Unique ID Connection",
//                                     relatedTo: relatedIdsArray,
//                                 },
//                             },
//                         }
//                     }
//                 });

//                 // Update all related documents with the _id of the original document
//                 relatedIdsArray.forEach(relatedId => {
//                     // Update related document if "Unique ID Connection" exists
//                     bulkOps.push({
//                         updateOne: {
//                             filter: { _id: relatedId, "relation.relationType": "Unique ID Connection" },
//                             update: { $addToSet: { "relation.$.relatedTo": document._id.toString() } },
//                         }
//                     });

//                     // Create a new "Unique ID Connection" relation if it doesn't exist
//                     bulkOps.push({
//                         updateOne: {
//                             filter: { _id: relatedId, "relation.relationType": { $ne: "Unique ID Connection" } },
//                             update: {
//                                 $addToSet: {
//                                     relation: {
//                                         relationType: "Unique ID Connection",
//                                         relatedTo: [document._id.toString()],
//                                     },
//                                 },
//                             }
//                         }
//                     });
//                 });

//                 console.log(`Document with content "${document.content}" updated with relations to "${relatedIdsArray.join(', ')}"`);
//             } else {
//                 console.log(`No match for content: ${document.content}`);
//             }

//             // Perform bulk write operations in batches to reduce memory usage
//             if (bulkOps.length >= BATCH_SIZE) {
//                 await Backend.bulkWrite(bulkOps);
//                 bulkOps.length = 0; // Clear the array after each batch

//                 // Manually trigger garbage collection if available
//                 if (global.gc) {
//                     global.gc();
//                 }
//             }
//         }

//         // Perform any remaining bulk write operations
//         if (bulkOps.length > 0) {
//             await Backend.bulkWrite(bulkOps);
//         }

//         console.log("idConnection completed");
//     } catch (error) {
//         console.error("Error in idConnectionController:", error);
//     }
// };

// module.exports = { idConnectionController };
