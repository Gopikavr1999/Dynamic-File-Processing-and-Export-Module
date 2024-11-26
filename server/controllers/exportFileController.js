const mongoose = require("mongoose");
const createBackendModel = require("../models/backendModel");

const exportFileController = async (req, res) => {
    try {
        const {
            selectedMaster,
            selectedHeaderIDs,
            selectedIDHeaderID,
            selectedP4USVARIANT,
            selectedP4USCC,
            backend,
        } = req.body;
        
        console.log("datas:",selectedMaster, selectedHeaderIDs, selectedIDHeaderID, selectedP4USVARIANT, selectedP4USCC, backend);
        const Backend = createBackendModel(backend);
        const NewCollection = mongoose.connection.collection(selectedMaster);
        console.log("new collection created");
        
        // Step 1: Find documents where selectedMaster is in the "File Connection"
        const fileConnectionDocs = await Backend.find({
            relation: {
                $elemMatch: {
                    relationType: "File Connection",
                    relatedTo: selectedMaster,
                },
            },
        }).catch(err => {
            console.error("Error finding file connection docs:", err);
            return [];
        });

        if (!fileConnectionDocs.length) {
            console.warn("No documents found for the given master.");
            return res.status(404).send("No documents found for the given master.");
        }

        // Step 2: Filter the documents where selectedIDHeaderID's ID is present in the "Header Connection"
        const filteredDocs = fileConnectionDocs.filter(doc =>
            doc.relation.some(relation =>
                relation.relationType === "Header Connection" &&
                relation.relatedTo.some(relatedId =>
                    selectedIDHeaderID.map(idObj => idObj.id).includes(relatedId)
                )
            )
        );

        // Add index to each header object
        const selectedHeaderIDsWithIndex = selectedHeaderIDs.map((headerObj, index) => ({
            ...headerObj,
            index,
        }));
        
        console.log("selectedHeaderIDsWithIndex", selectedHeaderIDsWithIndex);

        // Step 3: Iterate through each selectedHeaderID and filter the documents
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
                                    if (relation.relatedTo.includes(String(filteredDoc._id))) {
                                        const contentValue = filteredDoc.content;
                                        // let allRelatedToIds = new Set();

                                        // const crossReferenceDoc = await Backend.find({
                                        //     relation: {
                                        //         $elemMatch: {
                                        //             relationType: "Cross Reference",
                                        //             relatedTo: filteredDoc._id.toString(),
                                        //         },
                                        //     },
                                        // }).catch(err => {
                                        //     console.error("Error fetching cross reference docs:", err);
                                        //     return [];
                                        // });

                                        // console.log("crossReferenceDoc",crossReferenceDoc);
                                                                               

                                        // // Collect related IDs from crossReferenceDoc
                                        // crossReferenceDoc.forEach(doc => {
                                        //     doc.relation.forEach(rel => {
                                        //         if (rel.relationType === "Cross Reference") {
                                        //             rel.relatedTo.forEach(id => allRelatedToIds.add(id));
                                        //         }
                                        //     });
                                        // });

                                        // // Initialize P4US_ID_value as an empty array
                                        // let P4US_ID_value = [];

                                        // const relatedDocs = await Backend.find({
                                        //     _id: { $in: [...allRelatedToIds].map(id => new mongoose.Types.ObjectId(id)) },
                                        // }).catch(err => {
                                        //     console.error("Error fetching related docs:", err);
                                        //     return [];
                                        // });
                                        // console.log("relatedDocs", relatedDocs);
                                        // P4US_ID_value = relatedDocs.map(doc => doc.content);
                                        // console.log("P4US_ID_value",P4US_ID_value);

                                        // P4US_ID_value = Array.isArray(P4US_ID_value)
                                        // ? P4US_ID_value.filter(value => value !== contentValue).map(String)
                                        // : [];
                                        // console.log("P4US_ID_value ----- 2nd",P4US_ID_value)

                                        // Step 4: Check for content inclusion across documents with the same selectedHeaderID
                                        const matchingHeaderDocs = headerFilteredDocs.filter(otherDoc => 
                                            otherDoc.relation.some(rel =>
                                                rel.relationType === "Header Connection" &&
                                                rel.relatedTo.includes(headerObj.id) &&
                                                filteredDoc.content.includes(otherDoc.content)
                                            )
                                        );

                                        if (matchingHeaderDocs.length > 0) {
                                            // Step 5: Create a new document with the matching content values
                                            const documentData = {
                                                [selectedIDHeaderID[0].header]: contentValue,
                                                [headerObj.header]: matchingHeaderDocs.map(doc => doc.content).join(", "),
                                                // "P4US_ID": P4US_ID_value
                                            };

                                            // Insert or update the document in the new collection
                                            await NewCollection.updateOne(
                                                { [selectedIDHeaderID[0].header]: contentValue },
                                                { $set: documentData },
                                                { upsert: true }
                                            ).catch(err => console.error("Error updating new collection:", err));

                                            // Fetch the updated document to get its values
                                            const updatedDoc = await NewCollection.findOne({
                                                [selectedIDHeaderID[0].header]: contentValue,
                                            }).catch(err => console.error("Error fetching updated doc:", err));
                                            console.log("updatedDoc", updatedDoc);

                                            // Step 6: Add P4USVARIANT and P4USCC to the document if found
                                            if (updatedDoc) {
                                                const IDSplit = updatedDoc[selectedIDHeaderID[0].header].split("_");
                                                console.log("IDSplit", IDSplit);
                                                IDSplit.forEach((value, index) => {
                                                    console.log(`Index: ${index}, Value: ${value}`);
                                                });
                                                console.log("selectedHeaderIDsWithIndex", selectedHeaderIDsWithIndex);
                                                
                                                // Step 7: Check for any keys with multiple values
                                                for (const [key, value] of Object.entries(updatedDoc)) {
                                                    if (typeof value === 'string' && value.includes(',')) {
                                                        const headerIndex = selectedHeaderIDsWithIndex.find(
                                                            headerObj => headerObj.header === key
                                                        )?.index;
                                                        console.log(`${key}:${headerIndex}`);
                                                        
                                                        
                                                        const multipleValues = updatedDoc[key].split(',').map(item => item.trim());
                                                        console.log("multipleValues", multipleValues);
                                                        
                                                        const multipleValuedKeyIndex = IDSplit[headerIndex]; // Value at index 3 of IDSplit
                                                        console.log("Value at index", headerIndex, "of IDSplit:", multipleValuedKeyIndex);
                                                        
                                                        // Check for any matches
                                                        const matches = multipleValues.filter(modelCode => modelCode === multipleValuedKeyIndex);
                                                        console.log("matches", matches);
                                                        
                                                       // Update the document with the matched value or set it to an empty string if no match is found
                                                       const updatedValue = matches.length > 0 ? matches[0] : ""; // Empty string if no match
                                                       console.log(`Updating ${key} with value: ${updatedValue || '"" (empty string)'}`);

                                                       await NewCollection.updateOne(
                                                           { [selectedIDHeaderID[0].header]: contentValue },
                                                           {
                                                               $set: {
                                                                   [key]: updatedValue || "", // Update with first match or set to empty string
                                                               },
                                                           }
                                                       );
                                                    }
                                                }
                                                 // Re-fetch the updated document to reflect the latest changes
                                                const updatedDocAfterSave = await NewCollection.findOne({
                                                    [selectedIDHeaderID[0].header]: contentValue,
                                                }).catch(err => console.error("Error fetching updated doc after save:", err));

                                                console.log("updatedDoc after save", updatedDocAfterSave);
                                                
                                                const P4US_VARIANT_value = updatedDocAfterSave[selectedP4USVARIANT];
                                                const P4US_CC_value = updatedDocAfterSave[selectedP4USCC];
                                                
                                                // Update P4USVARIANT and P4USCC
                                                await NewCollection.updateOne(
                                                    { [selectedIDHeaderID[0].header]: contentValue },
                                                    {
                                                        $set: {
                                                            P4USVARIANT: P4US_VARIANT_value || "",
                                                            P4USCC: P4US_CC_value || "",
                                                        },
                                                    }
                                                ).catch(err => console.error("Error updating P4USVARIANT and P4USCC:", err));
                                            }
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
