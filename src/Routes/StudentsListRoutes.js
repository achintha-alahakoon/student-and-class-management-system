const express = require('express');
const StudentsListController = require('../Controllers/StudentsListController');

const router = express.Router();

router.get("/studentslist", StudentsListController.getAllStudents);
router.get("/tutorstudentslist", StudentsListController.getTutorStudents);
router.delete("/:userId", StudentsListController.deleteStudent);
router.get("/:studentId", StudentsListController.getStudent);
router.put("/edit/:selectedUserId", StudentsListController.updateStudent);

module.exports = router;
