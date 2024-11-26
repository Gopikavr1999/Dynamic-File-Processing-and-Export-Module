const fs = require('fs');
const path = require('path');
const { headerRelationController } = require('./headerRelationController');
const { idConnectionController } = require('./idConnectionController');
const createBackendModel = require('../models/backendModel');
const { crossReferenceController } = require('./crossReferenceController');
const { comprehensiveMatchController } = require('./comprehensiveMatchController');

const fileUploadController = async (req, res) => {
    try {
        const filePath = req.file.path;
        const fileNameWithExtension = req.file.originalname;
        const fileName = path.parse(fileNameWithExtension).name;

        const backend = req.body.backend;
        if (!backend) {
            console.error("Backend not provided in the request body.");
            return res.status(400).json({ error: 'Backend is required.' });
        }

        console.log(`Selected backend: ${backend}`);

        // Dynamically create the Backend model with the provided collection name
        const Backend = createBackendModel(backend);

        // Read the content of the uploaded file
        const fileContent = fs.readFileSync(filePath, 'utf8');
// --------------------
        // Split content by commas and newlines to get individual items
        const items = fileContent.split(/,|\n/).map(item => item.trim());

        // Use a Set to ensure unique items
        const uniqueItems = new Set(items);

        const bulkOps = [];

        for (const item of uniqueItems) {
            
            const trimmedItem = item.trim();

            // Check if the document exists
            const existingDoc = await Backend.findOne({ content: trimmedItem });

            if (existingDoc) {
                // If it exists, just add the fileName to the relatedTo array
                bulkOps.push({
                    updateOne: {
                        filter: { content: trimmedItem },
                        update: {
                            $addToSet: {
                                "relation.$[fc].relatedTo": fileName // Add fileName to the relatedTo array
                            }
                        },
                        arrayFilters: [{ "fc.relationType": "File Connection" }] // Apply this operation only to the 'File Connection' relation
                    }
                });
            } else {
                // If it doesn't exist, create a new document with the relation array
                bulkOps.push({
                    updateOne: {
                        filter: { content: trimmedItem },
                        update: {
                            $setOnInsert: {
                                content: trimmedItem,
                                dataType: "String",
                                relation: [{
                                    relationType: "File Connection", // Add the relationType
                                    relatedTo: [fileName] // Initialize relatedTo with fileName
                                },
                            {
                                relationType: "Header Connection", // Add the relationType
                                relatedTo: [] 
                            }]
                            }
                        },
                        upsert: true // Create document if it doesn't exist
                    }
                });
            }
        }
        console.log("Bulk write is ready to update the db");


        // Execute the bulkWrite for efficient updates/inserts
        if (bulkOps.length > 0) {
            await Backend.bulkWrite(bulkOps);
        }
        console.log("Documents created/updated successfully....");
// ----------------------

        // Extract headers and rows from the file content
        const [headerLine, ...rows] = fileContent.split('\n');
        const headers = headerLine.split(',').map(header => header.trim());

        // // HEADER-CONNECTION
        // console.log("headerRelationController started !!!!");
        // await headerRelationController(headers, rows, backend);
        // console.log("headerRelationController completed successfully !!!!");
        
        // Fetch all documents after saving
        const allDocuments = await Backend.find({});

        // Step 4: Extract the last term of each line (row)
        const lastTerms = rows.map(row => {
            const columns = row.split(',').map(item => item.trim());
            return columns[columns.length - 1]; // Get the last term of the row
        });

        // COMPREHENSIVE-CONNECTION
        console.log("comprehensiveMatchController started !!!!");
        await comprehensiveMatchController(allDocuments, lastTerms, backend);
        console.log("comprehensiveMatchController completed successfully !!!!");        

        // // UNIQUE ID CONNECTION
        // // Pass the lastTerms to the idConnectionController
        // console.log("idConnectionController started !!!!");
        // await idConnectionController(allDocuments, lastTerms, backend);
        // console.log("idConnectionController completed successfully !!!!");

        const lastTerm = headers[headers.length - 1];// header of the unique id
        console.log("lastTerm",lastTerm);
        const lastTermDoc = await Backend.findOne({ content: lastTerm });

        if (!lastTermDoc) {
            console.log(`No document found with content: ${lastTerm}`);
            return res.status(404).json({ message: 'No document found for the last term of the headers.' });
        }

        // const selectedID = lastTermDoc._id; // Get the _id of the unique id header document
        
        // const maxTimeLimit = 1800000; // 30 minutes in milliseconds
        
        // // Step 2: Find documents where relatedTo contains selectedID in "Header Connection"
        // const uniqueIDDocsCursor = Backend.find({
        //     relation: {
        //         $elemMatch: {
        //             relationType: "Header Connection",
        //             relatedTo: selectedID.toString() // unique id header document id
        //         }
        //     }
        // })
        // .maxTimeMS(maxTimeLimit)
        // .cursor(); // Get cursor

        // const uniqueIDDocs = await uniqueIDDocsCursor.toArray(); // Await the cursor to get results
        // console.log("uniqueIDDocs", uniqueIDDocs);

        // // Fetch all documents after saving
        // const allDocsCursor = Backend.find({})
        //     .maxTimeMS(maxTimeLimit)
        //     .cursor(); // Get cursor

        // const allDocs = await allDocsCursor.toArray(); // Await the cursor to get results
        // console.log("allDocs", allDocs);

        // // Pass the lastTerms to the crossReferenceController
        // console.log("Cross reference started !!!!");
        // await crossReferenceController(allDocs, uniqueIDDocs, backend);
        console.log("Cross reference added successfully....");      
        
        res.status(200).json({ message: 'File processed and data stored successfully without duplicates.' });
    } catch (error) {
        console.error("Error in fileUploadController:", error);
        res.status(500).json({ error: 'An error occurred while processing the file.' });
    }
};

module.exports = { fileUploadController };
