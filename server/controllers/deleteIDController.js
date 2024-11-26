const mongoose = require("mongoose");
const createBackendModel = require("../models/backendModel");

const deleteIDController = async (req,res) => {
    try {
        const {fileName} = req.body;
        console.log("collection",fileName);

         // Access the native MongoDB collection
         const Collection = mongoose.connection.collection(fileName);
        console.log("hi");
       
         // Remove the "P4US_ID" field from all documents in the collection
        const result = await Collection.updateMany(
            {},
            { $unset: { P4USVARIANT: "" } } // Use $unset to remove the field
        );
        console.log("result",result);
       
        res.status(200).send("P4US_ID deleted successfully");
    } catch (error) {
        console.log(error);
       
    }
}

module.exports = {deleteIDController}
