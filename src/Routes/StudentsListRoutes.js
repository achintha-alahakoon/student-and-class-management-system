const express = require('express');
const auth = require("../middleware/auth");
const StudentsListController = require('../Controllers/StudentsListController');

const router = express.Router();

router.get("/studentslist", auth, StudentsListController.getAllStudents);
router.get("/:studentId", auth, StudentsListController.getStudentById);
router.get("/tutorstudentslist", auth, StudentsListController.getTutorStudents);
router.delete("/:userId", auth, StudentsListController.deleteStudent);
router.put("/edit/:selectedStudentId", auth, StudentsListController.updateStudent);

module.exports = router;
