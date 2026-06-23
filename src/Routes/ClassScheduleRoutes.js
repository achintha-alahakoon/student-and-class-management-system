const express = require('express');
const ClassScheduleController = require('../Controllers/ClassScheduleController');

const router = express.Router();

router.post("/", ClassScheduleController.addClass);
router.get("/scheduledClasses", ClassScheduleController.getSchedule);
router.get("/student/scheduledClasses", ClassScheduleController.getStudentSchedule);
router.delete("/:ScheduleID", ClassScheduleController.deleteScheduleClass);
router.get("/getTutorScheduledClasses", ClassScheduleController.getTutorScheduledClasses);
router.get("/getParentStudentScheduledClasses", ClassScheduleController.getParentStudentScheduledClasses);


module.exports = router;