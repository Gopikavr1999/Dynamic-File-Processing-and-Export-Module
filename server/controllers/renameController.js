const renameController = (req,res) => {
    try {
        const { dbName,newdbName } = req.body;
        console.log("dbName ,newdbName",dbName, newdbName);
        res.json({ message: `Database renamed to ${newdbName}` });
    } catch (error) {
        console.log("Error",error);
        
    }
}

module.exports = {renameController}