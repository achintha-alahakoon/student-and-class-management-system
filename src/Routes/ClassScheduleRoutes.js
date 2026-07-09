const express = require('express');
const auth = require("../middleware/auth");
const ClassScheduleController = require('../Controllers/ClassScheduleController');

const router = express.Router();

router.post("/add-class", auth, ClassScheduleController.addClass);
router.get("/scheduledClasses", auth, ClassScheduleController.getScheduledClasses);
router.get("/scheduledClasses/:ScheduleID", auth, ClassScheduleController.getScheduledClassById);
router.get("/available-students/:classId", auth, ClassScheduleController.getAvailableStudents);
router.post("/assign-students/:classId", auth, ClassScheduleController.assignStudentsToClass);

router.delete("/:ScheduleID", auth, ClassScheduleController.deleteScheduleClass);
router.get("/getTutorScheduledClasses", auth, ClassScheduleController.getTutorScheduledClasses);
router.get("/getParentStudentScheduledClasses", auth, ClassScheduleController.getParentStudentScheduledClasses);
router.get("/getStudentSchedule", auth, ClassScheduleController.getStudentSchedule);


module.exports = router;