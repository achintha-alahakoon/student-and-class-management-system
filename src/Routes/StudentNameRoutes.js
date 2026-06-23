const express = require('express');
const StudentNameController = require('../Controllers/StudentNameController');

const router = express.Router();

router.get("/getstudentname", StudentNameController.getStudentName);
router.get("/getparentname", StudentNameController.getParentName);
router.get("/student/:ParentID/:StudentID", StudentNameController.getParentsStudent);
module.exports = router;