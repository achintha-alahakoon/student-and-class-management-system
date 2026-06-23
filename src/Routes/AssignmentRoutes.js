const express = require('express');
const AssignmentController = require('../Controllers/AssignmentController');

const router = express.Router();

router.get('/getgrades', AssignmentController.getGrades);
router.get('/getsubjects', AssignmentController.getSubjects);
router.get('/getassignmenttypes', AssignmentController.getAssignmentTypes);
router.post('/addassignmenttype', AssignmentController.addAssignmentType);
router.post('/getstudents', AssignmentController.getStudents);

module.exports = router;