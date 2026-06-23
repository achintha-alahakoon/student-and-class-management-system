const { Class, ClassSchedule, Tutor, EnrolledClass, Parent, ParentChild, Student } = require("../Models");
const jwt = require("jsonwebtoken");

// Add class and class schedule
exports.addClass = async (req, res) => {
  const { startDate, grade, repeatOn, hallNumber, startTime, endTime, tutor, subject } = req.body;

  try {
    const classObj = await Class.findOne({ where: { Grade: grade, Tutor: tutor, Subject: subject } });

    if (!classObj) {
      return res.status(400).json({ error: "Class with the specified Grade, Tutor, and Subject does not exist" });
    }

    await ClassSchedule.create({
      ScheduleDate: startDate,
      Start_Time: startTime,
      Repeat_On: repeatOn,
      Hall_Num: hallNumber,
      End_Time: endTime,
      ClassID: classObj.ClassID
    });

    res.status(200).json({ message: "Class schedule added successfully" });
  } catch (error) {
    console.error("Error adding class schedule:", error);
    res.status(500).json({ error: "Error adding class schedule" });
  }
};

// Get all scheduled classes
exports.getSchedule = async (req, res) => {
  try {
    const schedules = await ClassSchedule.findAll({
      include: [{
        model: Class,
        attributes: ['Subject', 'Grade', 'Tutor']
      }]
    });

    const results = schedules.map(schedule => ({
      Subject: schedule.class.Subject,
      Grade: schedule.class.Grade,
      Tutor: schedule.class.Tutor,
      ScheduleID: schedule.ScheduleID,
      Repeat_On: schedule.Repeat_On,
      Hall_Num: schedule.Hall_Num,
      Start_Time: schedule.Start_Time,
      End_Time: schedule.End_Time
    }));

    res.json(results);
  } catch (error) {
    console.error("Error fetching scheduled classes:", error);
    res.status(500).json({ error: "Error fetching scheduled classes" });
  }
};

//Delete class schedule
exports.deleteScheduleClass = async (req, res) => {
  const { ScheduleID } = req.params;

  try {
    await ClassSchedule.destroy({ where: { ScheduleID } });
    res.json({ message: "Class schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting class schedule:", error);
    res.status(500).json({ error: "Error deleting class schedule" });
  }
};

// get student schedule
exports.getStudentSchedule = async (req, res) => {
  let token = req.headers["authorization"];

  if (!token) return res.status(403).json({ error: "No token provided" });
  if (token.startsWith("Bearer ")) token = token.slice(7, token.length);

  jwt.verify(token, "secret_key", async (err, decoded) => {
    if (err) return res.status(500).json({ error: "Failed to authenticate token" });

    const userID = decoded.UserID;

    try {
      const enrolledClasses = await EnrolledClass.findAll({ where: { UserID: userID } });
      if (enrolledClasses.length === 0) return res.status(404).json({ error: "No classes found for this user" });

      const classIDs = enrolledClasses.map(ec => ec.ClassID);

      const schedules = await ClassSchedule.findAll({
        where: { ClassID: classIDs },
        include: [{ model: Class, attributes: ['Subject', 'Grade', 'Tutor'] }]
      });

      const results = schedules.map(schedule => ({
        Subject: schedule.class.Subject,
        Grade: schedule.class.Grade,
        Tutor: schedule.class.Tutor,
        ScheduleID: schedule.ScheduleID,
        Repeat_On: schedule.Repeat_On,
        Hall_Num: schedule.Hall_Num,
        Start_Time: schedule.Start_Time,
        End_Time: schedule.End_Time
      }));

      res.json(results);
    } catch (error) {
      console.error("Error fetching student schedule:", error);
      res.status(500).json({ error: "Error fetching student schedule" });
    }
  });
};

// Get tutor scheduled classes
exports.getTutorScheduledClasses = async (req, res) => {
  let token = req.headers["authorization"];

  if (!token) return res.status(403).json({ error: "No token provided" });
  if (token.startsWith("Bearer ")) token = token.slice(7, token.length);

  jwt.verify(token, "secret_key", async (err, decoded) => {
    if (err) return res.status(500).json({ error: "Failed to authenticate token" });

    const userID = decoded.UserID;

    try {
      const tutor = await Tutor.findOne({ where: { UserID: userID } });
      if (!tutor) return res.status(500).json({ error: "Error fetching tutor details" });

      const classes = await Class.findAll({ where: { TutorID: tutor.TutorID } });
      if (classes.length === 0) return res.status(500).json({ error: "Error fetching class details" });

      const classIDs = classes.map(c => c.ClassID);

      const schedules = await ClassSchedule.findAll({
        where: { ClassID: classIDs },
        include: [{ model: Class, attributes: ['Subject', 'Grade', 'Tutor'] }]
      });

      const results = schedules.map(schedule => ({
        ScheduleID: schedule.ScheduleID,
        ScheduleDate: schedule.ScheduleDate,
        Start_Time: schedule.Start_Time,
        Repeat_On: schedule.Repeat_On,
        Hall_Num: schedule.Hall_Num,
        End_Time: schedule.End_Time,
        ClassID: schedule.ClassID,
        Subject: schedule.class.Subject,
        Grade: schedule.class.Grade,
        Tutor: schedule.class.Tutor
      }));

      res.status(200).json(results);
    } catch (error) {
      console.error("Error fetching scheduled classes:", error);
      res.status(500).json({ error: "Error fetching scheduled classes" });
    }
  });
};

// get parent student scheduled classes
exports.getParentStudentScheduledClasses = async (req, res) => {
  let token = req.headers["authorization"];

  if (!token) return res.status(403).json({ error: "No token provided" });
  if (token.startsWith("Bearer ")) token = token.slice(7, token.length);

  jwt.verify(token, "secret_key", async (err, decoded) => {
    if (err) return res.status(500).json({ error: "Failed to authenticate token" });

    const userID = decoded.UserID;

    try {
      const parent = await Parent.findOne({ where: { UserID: userID } });
      if (!parent) return res.status(500).json({ error: "Error fetching parent details" });

      const parentChild = await ParentChild.findOne({ where: { ParentID: parent.ParentID } });
      if (!parentChild) return res.status(500).json({ error: "Error fetching student details" });

      const student = await Student.findOne({ where: { StudentID: parentChild.StudentID } });
      if (!student) return res.status(500).json({ error: "Error fetching user details" });

      const enrolledClasses = await EnrolledClass.findAll({ where: { UserID: student.UserID } });
      if (enrolledClasses.length === 0) return res.status(404).json({ error: "No classes found for this user" });

      const classIDs = enrolledClasses.map(ec => ec.ClassID);

      const schedules = await ClassSchedule.findAll({
        where: { ClassID: classIDs },
        include: [{ model: Class, attributes: ['Subject', 'Grade', 'Tutor'] }]
      });

      const results = schedules.map(schedule => ({
        Subject: schedule.class.Subject,
        Grade: schedule.class.Grade,
        Tutor: schedule.class.Tutor,
        ScheduleID: schedule.ScheduleID,
        Repeat_On: schedule.Repeat_On,
        Hall_Num: schedule.Hall_Num,
        Start_Time: schedule.Start_Time,
        End_Time: schedule.End_Time
      }));

      res.json(results);
    } catch (error) {
      console.error("Error fetching student schedule:", error);
      res.status(500).json({ error: "Error fetching student schedule" });
    }
  });
};
