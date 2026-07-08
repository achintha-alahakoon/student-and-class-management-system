const express = require('express');
const auth = require("../middleware/auth");
const AttendanceController = require('../Controllers/AttendanceController');

const router = express.Router();

router.get("/getAttendanceByClass/:classId", auth, AttendanceController.getAttendanceByClass);
router.post("/markAttendance", auth, AttendanceController.markAttendance);
router.get("/getAvailableStudents/:classId", auth, AttendanceController.getAvailableStudents);

router.get("/getAttendanceByStudent/:studentId", auth, AttendanceController.getAttendanceByStudent);
router.post("/updateAttendance", auth, AttendanceController.updateAttendance);
router.get("/getParentChildrenAttendance", auth, AttendanceController.getParentChildrenAttendance);
router.post("/getTutorAttendanceChart", auth, AttendanceController.getTutorAttendanceChart);

module.exports = router;