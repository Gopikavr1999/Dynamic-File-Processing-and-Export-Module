const createBackendModel = require("../models/backendModel");

// Example dynamic collection names, replace this with actual logic if needed
const collections = ['Backend_Cars', 'Backend_Bikes'];

const uploadedDataController = async (req, res) => {
  try {
    
    let allDocuments = [];
    
    // Iterate over all dynamic collections
    for (const collectionName of collections) {
      const BackendModel = createBackendModel(collectionName);
      
      console.log(`${collectionName}`);
      // Fetch documents from the current dynamic collection
      const documents = await BackendModel.find({});
      console.log("documents",documents);
      
      // Extract relatedTo values where relationType is "File Connection"
      const fileConnections = documents
      .flatMap((doc) => doc.relation)
      .filter((rel) => rel.relationType === "File Connection")
      .flatMap((rel) => rel.relatedTo);
      
      // Merge the documents from the current collection into allDocuments
      allDocuments = allDocuments.concat(fileConnections);
    }    
    
    // Remove duplicate values by converting the array to a Set and back to an array
    const allCollections = [...new Set(allDocuments)];
    console.log("allCollections",allCollections);

    res.json(allCollections);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Error fetching data" });
  }
};

module.exports = {
  uploadedDataController,
};

