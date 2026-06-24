const { Attendance, EnrolledClass, Class, ClassSchedule, Student, Tutor, Parent, ParentChild } = require("../Models");
const moment = require('moment-timezone');
const jwt = require("jsonwebtoken");

//get Attendance
exports.getAttendance = async (req, res) => {
  try {
    const students = await Student.findAll({
      attributes: ['StudentID', 'FirstName', 'LastName', 'Grade', 'UserID']
    });
    res.json(students);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Error fetching attendance" });
  }
};

//get attendance by student
exports.getAttendanceByStudent = async (req, res) => {
  const { studentId } = req.params;

  try {
    const student = await Student.findOne({ where: { StudentID: studentId } });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const userId = student.UserID;
    const currentDate = moment().tz('Asia/Colombo').format('YYYY-MM-DD');

    const enrolledClasses = await EnrolledClass.findAll({
      where: { UserID: userId },
      include: [
        { model: Class, attributes: ['Subject', 'Grade', 'Tutor'] }
      ]
    });

    const enrolledClassIds = enrolledClasses.map(ec => ec.enrolledclassID);

    const attendances = await Attendance.findAll({
      where: { enrolledclassID: enrolledClassIds, AttendanceDate: currentDate }
    });

    const attendanceMap = {};
    attendances.forEach(att => {
      attendanceMap[att.enrolledclassID] = att.Status;
    });

    const results = enrolledClasses.map(ec => ({
      enrolledclassID: ec.enrolledclassID,
      UserID: ec.UserID,
      ClassID: ec.ClassID,
      Subject: ec.class.Subject,
      Grade: ec.class.Grade,
      Tutor: ec.class.Tutor,
      Status: attendanceMap[ec.enrolledclassID] || null
    }));

    res.json(results);
  } catch (error) {
    console.error("Error fetching attendance details:", error);
    res.status(500).json({ error: "Error fetching attendance details" });
  }
};

exports.updateAttendance = async (req, res) => {
  const { studentId, classId, attendanceStatus } = req.body;

  try {
    const student = await Student.findOne({ where: { StudentID: studentId } });
    if (!student) {
      return res.status(404).json({ error: "StudentID not found" });
    }

    const enrolledClass = await EnrolledClass.findOne({
      where: { UserID: student.UserID, ClassID: classId }
    });

    if (!enrolledClass) {
      return res.status(404).json({ error: "Enrollment not found for the given UserID and ClassID" });
    }

    const classSchedule = await ClassSchedule.findOne({ where: { ClassID: classId } });
    if (!classSchedule) {
      return res.status(404).json({ error: "Class schedule not found" });
    }

    const { Start_Time, End_Time, Repeat_On } = classSchedule;
    const currentDate = moment().tz('Asia/Colombo');
    const currentDay = currentDate.format('dddd');
    const currentTime = currentDate.format('HH:mm');

    let finalAttendanceStatus = attendanceStatus;

    if (currentDay !== Repeat_On || currentTime > End_Time) {
      finalAttendanceStatus = 'Absent';
    }

    const attendanceDate = currentDate.format('YYYY-MM-DD');
    const attendanceTime = currentDate.format('HH:mm:ss');

    await Attendance.create({
      enrolledclassID: enrolledClass.enrolledclassID,
      Status: finalAttendanceStatus,
      AttendanceDate: attendanceDate,
      AttendanceTime: attendanceTime
    });

    res.json({ message: "Attendance status updated successfully!" });
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ error: "Error updating attendance" });
  }
};

exports.getParentChildrenAttendance = async (req, res) => {
  let token = req.headers['authorization'];

  if (!token) return res.status(403).json({ error: 'No token provided' });
  if (token.startsWith('Bearer ')) token = token.slice(7, token.length);

  jwt.verify(token, 'secret_key', async (err, decoded) => {
    if (err) return res.status(500).json({ error: 'Failed to authenticate token' });

    const userID = decoded.UserID;

    try {
      const parent = await Parent.findOne({ where: { UserID: userID } });
      if (!parent) return res.status(404).json({ error: 'ParentID not found' });

      const parentChildren = await ParentChild.findAll({ where: { ParentID: parent.ParentID } });
      if (parentChildren.length === 0) return res.status(404).json({ error: 'No students found for this parent' });

      const studentIDs = parentChildren.map(pc => pc.StudentID);

      const students = await Student.findAll({ where: { StudentID: studentIDs } });
      if (students.length === 0) return res.status(404).json({ error: 'No UserID found for these students' });

      const userIDStudentMap = {};
      students.forEach(student => {
        userIDStudentMap[student.UserID] = student.StudentID;
      });

      const userIDs = students.map(student => student.UserID);

      const enrolledClasses = await EnrolledClass.findAll({ where: { UserID: userIDs } });
      if (enrolledClasses.length === 0) return res.status(404).json({ error: 'No enrolled classes found for these users' });

      const enrolledClassIDs = enrolledClasses.map(ec => ec.enrolledclassID);

      const attendances = await Attendance.findAll({ where: { enrolledclassID: enrolledClassIDs } });
      if (attendances.length === 0) return res.status(404).json({ error: 'No attendance records found for these enrolled classes' });

      const attendanceCount = {};
      const attendancePresentCount = {};

      attendances.forEach(att => {
        const enrolledClassID = att.enrolledclassID;
        if (!attendanceCount[enrolledClassID]) {
          attendanceCount[enrolledClassID] = 0;
          attendancePresentCount[enrolledClassID] = 0;
        }
        attendanceCount[enrolledClassID]++;
        if (att.Status === 'Present') {
          attendancePresentCount[enrolledClassID]++;
        }
      });

      const attendancePercentage = {};
      enrolledClasses.forEach(ec => {
        const enrolledClassID = ec.enrolledclassID;
        const studentID = userIDStudentMap[ec.UserID];
        if (!attendancePercentage[studentID]) {
          attendancePercentage[studentID] = {
            totalClasses: 0,
            presentClasses: 0
          };
        }
        attendancePercentage[studentID].totalClasses += attendanceCount[enrolledClassID] || 0;
        attendancePercentage[studentID].presentClasses += attendancePresentCount[enrolledClassID] || 0;
      });

      const attendancePercentageResults = Object.keys(attendancePercentage).map(studentID => {
        const { totalClasses, presentClasses } = attendancePercentage[studentID];
        const percentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;
        return {
          StudentID: studentID,
          AttendancePercentage: percentage
        };
      });

      res.json(attendancePercentageResults);
    } catch (error) {
      console.error("Error fetching parent children attendance:", error);
      res.status(500).json({ error: "Error fetching parent children attendance" });
    }
  });
};

// get tutor attendance chart
exports.getTutorAttendanceChart = async (req, res) => {
  let token = req.headers['authorization'];

  if (!token) return res.status(403).json({ error: 'No token provided' });
  if (token.startsWith('Bearer ')) token = token.slice(7, token.length);

  jwt.verify(token, 'secret_key', async (err, decoded) => {
    if (err) return res.status(500).json({ error: 'Failed to authenticate token' });

    const userID = decoded.UserID;

    try {
      const tutor = await Tutor.findOne({ where: { UserID: userID } });
      if (!tutor) return res.status(404).json({ error: "TutorID not found" });

      const classes = await Class.findAll({ where: { TutorID: tutor.TutorID } });
      const classIDs = classes.map(c => c.ClassID);

      const enrolledClasses = await EnrolledClass.findAll({ where: { ClassID: classIDs } });
      const totalStudentsCount = enrolledClasses.length;
      const enrolledClassIDs = enrolledClasses.map(ec => ec.enrolledclassID);

      const currentDate = moment().tz('Asia/Colombo').format('YYYY-MM-DD');

      const attendances = await Attendance.findAll({
        where: { enrolledclassID: enrolledClassIDs, AttendanceDate: currentDate }
      });

      const attendanceData = {
        present: 0,
        absent: 0
      };

      attendances.forEach(att => {
        if (att.Status === 'Present') {
          attendanceData.present += 1;
        }
      });

      attendanceData.absent = totalStudentsCount - attendanceData.present;

      return res.json(attendanceData);
    } catch (error) {
      console.error("Error fetching tutor attendance chart:", error);
      res.status(500).json({ error: "Error fetching tutor attendance chart" });
    }
  });
};
