const mongoose = require("mongoose");
const createBackendModel = require("../models/backendModel");


// const exportFileController = async (req, res) => {
//     try {
//         const { selectedMaster, selectedHeaderIDs, selectedIDHeaderID, selectedP4USVARIANT, selectedP4USCC, backend } = req.body;
//         console.log(selectedMaster, selectedHeaderIDs, selectedIDHeaderID, selectedP4USVARIANT, selectedP4USCC, backend);

//         const Backend = createBackendModel(backend);

//         // Create a new collection with the name as selectedMaster
//         const NewCollection = mongoose.connection.collection(selectedMaster);

//         // Step 1: Find documents where selectedMaster is in the "File Connection"
//         const fileConnectionDocs = await Backend.find({
//             relation: {
//                 $elemMatch: {
//                     relationType: "File Connection",
//                     relatedTo: selectedMaster
//                 }
//             }
//         });
//         // console.log("fileConnectionDocs",fileConnectionDocs);        

//         // Step 2: Filter the documents where selectedIDHeaderID(unique ID's document _id) is present in the "Header Connection"
//         const filteredDocs = fileConnectionDocs.filter(doc =>
//             doc.relation.some(relation =>
//                 relation.relationType === "Header Connection" &&
//                 relation.relatedTo.some(relatedId => selectedIDHeaderID.map(idObj => idObj.id).includes(relatedId))
//             )
//         );
//         // console.log("filteredDocs",JSON.stringify(filteredDocs,null,2));
//         console.log("filteredDocs outer the loop --------------------",filteredDocs);
        

//         // Step 3: Filter `fileConnectionDocs` by `selectedHeaderIDs.id` present in "Header Connection"
//         for (const headerObj of selectedHeaderIDs) {
//             console.log("headerObj",headerObj);
            
//             const headerFilteredDocs = fileConnectionDocs.filter(doc =>
//                 doc.relation.some(relation =>
//                     relation.relationType === "Header Connection" &&
//                     relation.relatedTo.includes(headerObj.id)
//                 )
//             );
//             console.log("headerFilteredDocs",JSON.stringify(headerFilteredDocs,null,2));            

//             // Log the `content` values of these filtered documents
//             for (const headerDoc of headerFilteredDocs) {
//                 console.log("headerDoc",headerDoc);
//                 // console.log("headerDoc",JSON.stringify(headerDoc,null,2));
                
//                 console.log(`Header: ${headerObj.header}, Content: ${headerDoc.content}`);

//                 // Step 4: Check if any filteredDoc's `_id` is present in the "Unique ID Connection" `relatedTo` array of headerFilteredDocs
//                 for (const relation of headerDoc.relation) {
//                     console.log("relation",relation);
                    
//                     // if (relation.relationType === "Unique ID Connection") {
//                     //     for (const filteredDoc of filteredDocs) {
//                     //         console.log("filteredDoc",filteredDoc);
                            
//                     //         if (relation.relatedTo.includes(String(filteredDoc._id))) {
//                     //             const contentValue = filteredDoc.content;
//                     //             console.log("contentValue",contentValue);
                                

//                     //             // Find the document where relationType is "Cross Reference" and its relatedTo includes filteredDoc._id
//                     //             const crossReferenceDoc = await Backend.findOne({
//                     //                 relation: {
//                     //                     $elemMatch: {
//                     //                         relationType: "Cross Reference",
//                     //                         relatedTo: filteredDoc._id.toString()
//                     //                     }
//                     //                 }
//                     //             });
//                     //             console.log("crossReferenceDoc",crossReferenceDoc);
                                

//                     //             // Initialize P4US_ID_value as an empty array
//                     //             let P4US_ID_value = [];

//                     //             if (crossReferenceDoc) {
//                     //                 const relatedToIds = crossReferenceDoc.relation
//                     //                     .find(rel => rel.relationType === "Cross Reference")
//                     //                     ?.relatedTo || [];
//                     //                     console.log("relatedToIds",relatedToIds);
                                        

//                     //                 const relatedDocs = await Backend.find({
//                     //                     _id: { $in: relatedToIds.map(id => new mongoose.Types.ObjectId(id)) }
//                     //                 });
//                     //                 console.log("relatedDocs",relatedDocs);                                    

//                     //                 P4US_ID_value = relatedDocs.map(doc => doc.content);
//                     //                 console.log("P4US_ID_value",P4US_ID_value);
                                    

//                     //                 P4US_ID_value = Array.isArray(P4US_ID_value)
//                     //                     ? P4US_ID_value.filter(value => value !== contentValue).map(String)
//                     //                     : [];
//                     //                 console.log("P4US_ID_value ----- 2nd",P4US_ID_value);
                                    

//                     //                 // Update the document with both header and P4US_ID
//                     //                 await NewCollection.updateOne(
//                     //                     { [selectedIDHeaderID[0].header]: contentValue },
//                     //                     {
//                     //                         $set: {
//                     //                             [headerObj.header]: headerDoc.content,
//                     //                             "P4US_ID": P4US_ID_value
//                     //                         }
//                     //                     },
//                     //                     { upsert: true }
//                     //                 );
//                     //                 console.log("selectedIDHeaderID",selectedIDHeaderID);

//                     //                 // Fetch the newly updated or created document
//                     //                 const updatedDoc = await NewCollection.findOne({
//                     //                     [selectedIDHeaderID[0].header]: contentValue
//                     //                 });
//                     //                 console.log("updatedDoc",updatedDoc);

//                     //                 if (updatedDoc) {
//                     //                     const P4US_VARIANT_value = updatedDoc[selectedP4USVARIANT];
//                     //                     const P4US_CC_value = updatedDoc[selectedP4USCC];

//                     //                     // console.log("Fetched P4US_VARIANT_value and P4US_CC_value after update:", P4US_VARIANT_value, P4US_CC_value);

//                     //                     if (P4US_VARIANT_value || P4US_CC_value) {
//                     //                         await NewCollection.updateOne(
//                     //                             { [selectedIDHeaderID[0].header]: contentValue },
//                     //                             {
//                     //                                 $set: {
//                     //                                     "P4US_VARIANT": P4US_VARIANT_value,
//                     //                                     "P4US_CC": P4US_CC_value
//                     //                                 }
//                     //                             }
//                     //                         );
//                     //                         // console.log("Updated P4US_VARIANT in the document");
//                     //                     } else {
//                     //                         console.error(`P4US_VARIANT_value is null. Key "${selectedP4USVARIANT}" not found in the updated document.`);
//                     //                     }
//                     //                 } else {
//                     //                     console.error("Document not found after update.");
//                     //                 }
//                     //             }
//                     //         }
//                     //     }
//                     // }
//                     if (relation.relationType === "Unique ID Connection") {
//                         try {
//                             // Process all filteredDocs concurrently using Promise.all for better performance
//                             await Promise.all(
//                                 filteredDocs.map(async (filteredDoc) => {
//                                     console.log("filteredDoc", filteredDoc);//unique Id's included documents
                    
//                                     if (relation.relatedTo.includes(String(filteredDoc._id))) {
//                                         const contentValue = filteredDoc.content;
//                                         console.log("contentValue", contentValue);
                    
//                                         // Find the document where relationType is "Cross Reference"
//                                         const crossReferenceDoc = await Backend.find({
//                                             relation: {
//                                                 $elemMatch: {
//                                                     relationType: "Cross Reference",
//                                                     relatedTo: filteredDoc._id.toString(),
//                                                 },
//                                             },
//                                         });
//                                         console.log(`crossReferenceDoc of ${filteredDoc.content}`, JSON.stringify(crossReferenceDoc,null,2));
                    
//                                         // Initialize P4US_ID_value as an empty array
//                                         let P4US_ID_value = [];
                    
//                                         let allRelatedToIds = new Set();  // Use a Set to avoid duplicates

//                                         if (Array.isArray(crossReferenceDoc) && crossReferenceDoc.length > 0) {
//                                             crossReferenceDoc.forEach(doc => {
//                                                 // Loop through all relations of the document
//                                                 doc.relation.forEach(rel => {
//                                                     if (rel.relationType === "Cross Reference") {
//                                                         // Add all relatedTo IDs to the Set
//                                                         rel.relatedTo.forEach(id => allRelatedToIds.add(id));
//                                                     }
//                                                 });
//                                             });
                                            
//                                             console.log("All relatedTo IDs from Cross References:", [...allRelatedToIds]);
                                            
//                                             // Fetch related documents for all unique IDs
//                                             const relatedDocs = await Backend.find({
//                                                 _id: {
//                                                     $in: [...allRelatedToIds].map(id => new mongoose.Types.ObjectId(id)),
//                                                 },
//                                             });

//                                             console.log("relatedDocs", relatedDocs);
                                       
//                     // ------------------------check---------------
//                                             // Filter out the current contentValue from relatedDocs and map to content
//                                             P4US_ID_value = relatedDocs
//                                                 .map((doc) => doc.content)
//                                                 .filter((value) => value !== contentValue)
//                                                 .map(String);
//                                             console.log("P4US_ID_value", P4US_ID_value);
//                                             console.log("[headerObj.header], headerDoc.content,", [headerObj.header], headerDoc.content,);

                                            
                    
//                                             // Update the document with both header and P4US_ID
//                                             await NewCollection.updateOne(
//                                                 { [selectedIDHeaderID[0].header]: contentValue },
//                                                 {
//                                                     $set: {
//                                                         [headerObj.header]: headerDoc.content,
//                                                         P4US_ID: P4US_ID_value,
//                                                     },
//                                                 },
//                                                 { upsert: true }
//                                             );
//                                             console.log("selectedIDHeaderID", selectedIDHeaderID);
                    
//                                             // Fetch the newly updated or created document
//                                             const updatedDoc = await NewCollection.findOne({
//                                                 [selectedIDHeaderID[0].header]: contentValue,
//                                             });
//                                             console.log("updatedDoc", updatedDoc);
                    
//                                             if (updatedDoc) {
//                                                 const P4US_VARIANT_value = updatedDoc[selectedP4USVARIANT];
//                                                 const P4US_CC_value = updatedDoc[selectedP4USCC];
//                                                 console.log("P4US_VARIANT_value",P4US_VARIANT_value);
//                                                 console.log("P4US_CC_value",P4US_CC_value);
                                                
                    
//                                                 if (P4US_VARIANT_value || P4US_CC_value) {
//                                                     await NewCollection.updateOne(
//                                                         { [selectedIDHeaderID[0].header]: contentValue },
//                                                         {
//                                                             $set: {
//                                                                 P4US_VARIANT: P4US_VARIANT_value,
//                                                                 P4US_CC: P4US_CC_value,
//                                                             },
//                                                         }
//                                                     );
//                                                     console.log("Updated P4US_VARIANT in the document");
//                                                 } else {
//                                                     console.error(
//                                                         `P4US_VARIANT_value is null. Key "${selectedP4USVARIANT}" not found in the updated document.`
//                                                     );
//                                                 }
//                                             } else {
//                                                 console.error("Document not found after update.");
//                                             }
//                                         }
//                                     }
//                                 })
//                             );
//                         } catch (err) {
//                             console.error("Error processing filteredDocs:", err);
//                         }
//                     }
                    
//                 }
//             }
//         }
//         console.log("Master Collection created successfully!!!!!!!");

//         res.status(200).send("Master Collection created successfully");

//     } catch (error) {
//         console.error("Error fetching data:", error);
//         res.status(500).send("Error fetching data");
//     }
// };

// module.exports = { exportFileController };
const exportFileController = async (req, res) => {
    try {
        const { selectedMaster, selectedHeaderIDs, selectedIDHeaderID, selectedP4USVARIANT, selectedP4USCC, backend } = req.body;
        console.log(selectedMaster, selectedHeaderIDs, selectedIDHeaderID, selectedP4USVARIANT, selectedP4USCC, backend);

        const Backend = createBackendModel(backend);

        // Create a new collection with the name as selectedMaster
        const NewCollection = mongoose.connection.collection(selectedMaster);

        // Step 1: Find documents where selectedMaster is in the "File Connection"
        const fileConnectionDocs = await Backend.find({
            relation: {
                $elemMatch: {
                    relationType: "File Connection",
                    relatedTo: selectedMaster
                }
            }
        });

        // Step 2: Filter the documents where selectedIDHeaderID's ID is present in the "Header Connection"
        const filteredDocs = fileConnectionDocs.filter(doc =>
            doc.relation.some(relation =>
                relation.relationType === "Header Connection" &&
                relation.relatedTo.some(relatedId => selectedIDHeaderID.map(idObj => idObj.id).includes(relatedId))
            )
        );

        // Step 3: Iterate through each `selectedHeaderID` and filter the documents
        for (const headerObj of selectedHeaderIDs) {
            console.log("headerObj", headerObj);

            const headerFilteredDocs = fileConnectionDocs.filter(doc =>
                doc.relation.some(relation =>
                    relation.relationType === "Header Connection" &&
                    relation.relatedTo.includes(headerObj.id)
                )
            );

            for (const headerDoc of headerFilteredDocs) {
                for (const relation of headerDoc.relation) {
                    if (relation.relationType === "Unique ID Connection") {
                        try {
                            await Promise.all(
                                filteredDocs.map(async (filteredDoc) => {
                                    // Check if the current filteredDoc's `_id` is in the relatedTo array
                                    if (relation.relatedTo.includes(String(filteredDoc._id))) {
                                        const contentValue = filteredDoc.content;

                                        let allRelatedToIds = new Set();
                                        const crossReferenceDoc = await Backend.find({
                                            relation: {
                                                $elemMatch: {
                                                    relationType: "Cross Reference",
                                                    relatedTo: filteredDoc._id.toString(),
                                                },
                                            },
                                        });

                                        crossReferenceDoc.forEach(doc => {
                                            doc.relation.forEach(rel => {
                                                if (rel.relationType === "Cross Reference") {
                                                    rel.relatedTo.forEach(id => allRelatedToIds.add(id));
                                                }
                                            });
                                        });

                                        const relatedDocs = await Backend.find({
                                            _id: { $in: [...allRelatedToIds].map(id => new mongoose.Types.ObjectId(id)) },
                                        });

                                        // Step 4: Create a new document with the `contentValue`
                                        const documentData = {
                                            [selectedIDHeaderID[0].header]: contentValue,
                                            [headerObj.header]: headerDoc.content,
                                        };

                                        // Insert the document into the new collection
                                        await NewCollection.updateOne(
                                            { [selectedIDHeaderID[0].header]: contentValue },
                                            { $set: documentData },
                                            { upsert: true }
                                        );

                                        // Fetch the updated document to get its values
                                        const updatedDoc = await NewCollection.findOne({
                                            [selectedIDHeaderID[0].header]: contentValue,
                                        });

                                        // Step 5: Add P4USVARIANT and P4USCC
                                        if (updatedDoc) {
                                            const P4US_VARIANT_value = updatedDoc[selectedP4USVARIANT.header];
                                            const P4US_CC_value = updatedDoc[selectedP4USCC.header];

                                            await NewCollection.updateOne(
                                                { [selectedIDHeaderID[0].header]: contentValue },
                                                {
                                                    $set: {
                                                        P4USVARIANT: P4US_VARIANT_value,
                                                        P4USCC: P4US_CC_value,
                                                    },
                                                }
                                            );
                                        }
                                    }
                                })
                            );
                        } catch (err) {
                            console.error("Error processing filteredDocs:", err);
                        }
                    }
                }
            }
        }

        console.log("Master Collection created successfully!");
        res.status(200).send("Master Collection created successfully");
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data");
    }
};

module.exports = { exportFileController };

