const mongoose = require('mongoose');

// Define the schema for the Backend collection
const backendSchema = new mongoose.Schema({
    content: String,
    dataType: String,
}, { strict: false });

// // Create and export the model for the Backend collection
// const Backend = mongoose.model('Backend', backendSchema);

// module.exports = Backend;

// Function to create a model with a dynamic collection name
const createBackendModel = (collectionName) => {
    return mongoose.model(collectionName, backendSchema);
};

module.exports = createBackendModel;