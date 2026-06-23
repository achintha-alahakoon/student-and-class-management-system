const express = require('express');
const SubjectListController = require('../Controllers/SubjectListController');

const router = express.Router();

router.get("/subjectslist", SubjectListController.getAllSubjects);
router.get("/getaverages", SubjectListController.getSubjectAverages);

module.exports = router;