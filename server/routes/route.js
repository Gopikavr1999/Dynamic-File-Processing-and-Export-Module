const express = require('express');
const router = express.Router();
const multer = require('multer');
const { fileUploadController } = require('../controllers/fileUploadController');
const { uploadedDataController } = require('../controllers/uploadedDataController');
const { fetchHeaderController } = require('../controllers/fetchHeaderController');
const { exportFileController } = require('../controllers/exportFileController');
const { renameController } = require('../controllers/renameController');
const { deleteController } = require('../controllers/deleteController');
const { uniqueIDMapController } = require('../controllers/uniqueIDMapController');
const { deleteIDController } = require('../controllers/deleteIDController');

const upload = multer({ dest: 'uploads/' });

//upload file
router.post("/upload", upload.single('csv'), fileUploadController);

//Rename DB
router.post("/rename", renameController);

//Delete file
router.post("/delete", deleteController);

// Route for fetch Masters details
router.get('/uploadedDataFromDB',uploadedDataController);

//Fetch-masters
router.post('/fetchMaster',uploadedDataController);

//fetch-headers
router.post('/fetchHeaders',fetchHeaderController)

//export-file
router.post('/exportFile',exportFileController)

//uniqueID
router.post('/uniqueID',uniqueIDMapController)

//delete-ID
router.post('/deleteID',deleteIDController)

module.exports = router;