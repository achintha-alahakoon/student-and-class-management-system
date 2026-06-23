const express = require('express');
const ClassesController = require('../Controllers/ClassesController');

const router = express.Router();

router.get('/tutorclasses', ClassesController.getTutorClasses);
router.get('/studentclasses', ClassesController.getStudentClasses);

module.exports = router;