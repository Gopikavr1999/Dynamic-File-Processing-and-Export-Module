const createBackendModel = require("../models/backendModel");

const fetchHeaderController = async (req, res) => {
    try {
        const { selectedMaster, backend } = req.body;
        console.log("Selected Master:", selectedMaster);
        console.log("Selected backend:", backend);

        const Backend = createBackendModel(backend);

         // Find the document where selectedMaster is in the "File Connection" relatedTo array
         const documents = await Backend.find({
            relation: {
                $elemMatch: {
                    relationType: "File Connection",
                    relatedTo: selectedMaster
                }
            }
        });
        // console.log("documents",documents);
        

        // If no documents is found, return a 404
        if (!documents) {
            return res.status(404).json({ message: "No document found with the selected master." });
        }

        // Array to store the 'relatedTo' values of 'header connection' from all documents
        let headerConnections = [];

        // Loop through each document and extract 'relatedTo' from 'header connection'
        documents.forEach(document => {
            const headerConnection = document.relation.find(
                (rel) => rel.relationType === "Header Connection"
            );

            // If a 'header connection' is found, add its 'relatedTo' array to the result
            if (headerConnection) {
                headerConnections = headerConnections.concat(headerConnection.relatedTo);
            }
        });


        // Remove duplicate IDs by converting the array to a Set and back to an array
        headerConnections = [...new Set(headerConnections)];

        // If no 'header connection' is found in any document, return an empty array
        if (headerConnections.length === 0) {
            return res.status(200).json({ message: "No 'header connection' relation found.", data: [] });
        }

        console.log("All headerConnections relatedTo:", headerConnections);

        // Fetch the documents that match the _id values in headerConnections
        const headerDocuments = await Backend.find({ _id: { $in: headerConnections } }, 'content');

        // Create a mapping of header ID to content value
        const headerMapping = {};
        headerDocuments.forEach(doc => {
            headerMapping[doc._id] = doc.content;
        });

        console.log("Header mapping:", headerMapping);
        // Send the 'relatedTo' array from 'header connection' back to the client
        res.status(200).json(headerMapping);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Error fetching data" });
    }
};

module.exports = { fetchHeaderController };
