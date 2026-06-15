const express = require('express');
const GradesController = require('../Controllers/GradesController');

const router = express.Router();

router.post("/addgrade", GradesController.addGrades);
router.get("/getgrades", GradesController.getGrades);
router.get("/getParentStudentgrades", GradesController.getParentStudentgrades);
router.get("/history", GradesController.getGradeHistory);

module.exports = router;
