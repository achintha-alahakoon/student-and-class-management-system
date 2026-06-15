const express = require('express');
const LectureMaterialController = require('../Controllers/LectureMaterialController'); 

const router = express.Router();

router.post('/upload', LectureMaterialController.upload);
router.post('/createFolder', LectureMaterialController.createFolder);
router.get('/getFolders', LectureMaterialController.getFolders);

module.exports = router;