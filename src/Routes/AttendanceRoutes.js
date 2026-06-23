const express = require('express');
const AttendanceController = require('../Controllers/AttendanceController');

const router = express.Router();

router.get("/getAttendance", AttendanceController.getAttendance);
router.get("/getAttendanceByStudent/:studentId", AttendanceController.getAttendanceByStudent);
router.post("/updateAttendance", AttendanceController.updateAttendance);
router.get("/getParentChildrenAttendance", AttendanceController.getParentChildrenAttendance);
router.post("/getTutorAttendanceChart", AttendanceController.getTutorAttendanceChart);

module.exports = router;