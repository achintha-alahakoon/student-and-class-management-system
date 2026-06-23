const express = require('express');
const AssignController = require('../Controllers/AssignController');

const router = express.Router();
router.post('/assignStudent', AssignController.assignStudent);
router.post('/assignTutor', AssignController.assignTutor);
router.get('/getStudents', AssignController.getStudents);

module.exports = router;