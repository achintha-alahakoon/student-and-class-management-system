const {
  Attendance,
  EnrolledClass,
  Class,
  ClassSchedule,
  Student,
  Tutor,
  Parent,
  ParentChild,
} = require("../Models");
const moment = require("moment-timezone");
const jwt = require("jsonwebtoken");

// Get attendance by class
exports.getAttendanceByClass = async (req, res) => {
  const { classId } = req.params;
  const { date }    = req.query;
  const TenantID    = req.user?.tenantId ?? req.TenantID;
 
  try {
    // Build where clause — no ClassID on attendance table
    // Filter via enrolledclassID → EnrolledClass.ClassID
    const attendanceWhere = { TenantID };
    if (date) attendanceWhere.Date = date;
 
    const records = await Attendance.findAll({
      where: attendanceWhere,
      include: [
        {
          model: EnrolledClass,
          where: { ClassID: classId, TenantID },  // scope to class here
          attributes: ["enrolledclassID", "ClassID", "StudentID"],
          include: [
            {
              model:      Student,
              attributes: ["StudentID", "FirstName", "LastName"],
            },
          ],
        },
      ],
      order: [
        [EnrolledClass, Student, "LastName",  "ASC"],
        [EnrolledClass, Student, "FirstName", "ASC"],
      ],
    });
 
    const formatted = records.map((r) => {
      const student = r.enrolledclass?.student;
      return {
        AttendanceID:    r.AttendanceID,
        enrolledclassID: r.enrolledclassID,
        StudentID:       student?.StudentID  ?? null,
        FirstName:       student?.FirstName  ?? "—",
        LastName:        student?.LastName   ?? "—",
        Status:          r.Status,
        Date:            r.Date,
        ScanTime:        formatTime(r.Time),
        MarkedBy:        r.MarkedBy,
      };
    });
 
    return res.status(200).json({
      status:  "success",
      classId,
      date:    date ?? null,
      records: formatted,
    });
 
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return res.status(500).json({
      status:  "error",
      message: "Failed to fetch attendance records",
    });
  }
};

// Helper: Convert TIME to "HH:MM AM/PM" format
function formatTime(timeStr) {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

// Get available students for a class

exports.getAvailableStudents = async (req, res) => {
  const { classId } = req.params;
  const TenantID    = req.user?.tenantId ?? req.TenantID;
 
  try {
    // ── Step 1: Get the class grade ───────────────────────
    const cls = await Class.findOne({
      where: { ClassID: classId, TenantID },
      attributes: ["ClassID", "Grade"],
    });
 
    if (!cls) {
      return res.status(404).json({ status: "error", message: "Class not found" });
    }
 
    // ── Step 2: Get already enrolled StudentIDs ───────────
    const enrolledRecords = await EnrolledClass.findAll({
      where: { ClassID: classId, TenantID },
      attributes: ["StudentID"],
    });
 
    const enrolledIds = new Set(enrolledRecords.map((r) => r.StudentID));
 
    // ── Step 3: Get all students for this grade + tenant ──
    const allStudents = await Student.findAll({
      where: { Grade: cls.Grade, TenantID },
      attributes: ["StudentID", "FirstName", "LastName", "Grade", "Gender"],
      order: [["LastName", "ASC"], ["FirstName", "ASC"]],
    });
 
    // ── Step 4: Return enrolled students only ────────────
    const students = allStudents
      .filter((s) => enrolledIds.has(s.StudentID))
      .map((s) => ({
        StudentID: s.StudentID,
        FirstName: s.FirstName,
        LastName:  s.LastName,
        Grade:     s.Grade,
        Gender:    s.Gender,
      }));
 
    return res.status(200).json({
      status:   "success",
      grade:    cls.Grade,
      students,
    });
 
  } catch (error) {
    console.error("Error fetching available students:", error);
    return res.status(500).json({
      status:  "error",
      message: error.message || "Error fetching students",
    });
  }
};

// Mark attendance
exports.markAttendance = async (req, res) => {
  const { classId, date, attendance } = req.body;
  const TenantID = req.user?.tenantId ?? req.TenantID;
 
  if (!classId || !date || !Array.isArray(attendance) || attendance.length === 0) {
    return res.status(400).json({
      status:  "error",
      message: "classId, date and attendance array are required",
    });
  }
 
  try {
    // Step 1: Get enrolledclassID for each student in this class
    const studentIds = attendance.map((a) => a.studentId);
 
    const enrolledRecords = await EnrolledClass.findAll({
      where: {
        ClassID:   classId,
        StudentID: studentIds,
        TenantID,
      },
      attributes: ["enrolledclassID", "StudentID"],
    });
 
    // Map StudentID -> enrolledclassID
    const enrolledMap = {};
    enrolledRecords.forEach((r) => {
      enrolledMap[r.StudentID] = r.enrolledclassID;
    });
 
    const enrolledClassIds = enrolledRecords.map((r) => r.enrolledclassID);
 
    if (enrolledClassIds.length === 0) {
      return res.status(400).json({
        status:  "error",
        message: "No enrolled students found for this class",
      });
    }
 
    // Step 2: Delete existing records for this date using enrolledclassID
    // (attendance table has no ClassID column — only enrolledclassID)
    await Attendance.destroy({
      where: {
        enrolledclassID: enrolledClassIds,
        Date:            date,
        TenantID,
      },
    });
 
    // Step 3: Build new records using enrolledclassID from lookup
    const records = attendance
      .filter((a) => enrolledMap[a.studentId])
      .map((a) => ({
        enrolledclassID: enrolledMap[a.studentId],
        Date:            date,
        Time:            new Date().toTimeString().slice(0, 8),
        Status:          a.status,
        MarkedBy:        a.markedBy || "Admin",
        TenantID,
      }));
 
    await Attendance.bulkCreate(records);
 
    return res.status(200).json({
      status:  "success",
      message: "Attendance marked successfully",
      count:   records.length,
    });
 
  } catch (error) {
    console.error("Error marking attendance:", error);
    return res.status(500).json({
      status:  "error",
      message: "Failed to mark attendance",
    });
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
    const currentDate = moment().tz("Asia/Colombo").format("YYYY-MM-DD");

    const enrolledClasses = await EnrolledClass.findAll({
      where: { UserID: userId },
      include: [{ model: Class, attributes: ["Subject", "Grade", "Tutor"] }],
    });

    const enrolledClassIds = enrolledClasses.map((ec) => ec.enrolledclassID);

    const attendances = await Attendance.findAll({
      where: { enrolledclassID: enrolledClassIds, AttendanceDate: currentDate },
    });

    const attendanceMap = {};
    attendances.forEach((att) => {
      attendanceMap[att.enrolledclassID] = att.Status;
    });

    const results = enrolledClasses.map((ec) => ({
      enrolledclassID: ec.enrolledclassID,
      UserID: ec.UserID,
      ClassID: ec.ClassID,
      Subject: ec.class.Subject,
      Grade: ec.class.Grade,
      Tutor: ec.class.Tutor,
      Status: attendanceMap[ec.enrolledclassID] || null,
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
      where: { UserID: student.UserID, ClassID: classId },
    });

    if (!enrolledClass) {
      return res
        .status(404)
        .json({
          error: "Enrollment not found for the given UserID and ClassID",
        });
    }

    const classSchedule = await ClassSchedule.findOne({
      where: { ClassID: classId },
    });
    if (!classSchedule) {
      return res.status(404).json({ error: "Class schedule not found" });
    }

    const { Start_Time, End_Time, Repeat_On } = classSchedule;
    const currentDate = moment().tz("Asia/Colombo");
    const currentDay = currentDate.format("dddd");
    const currentTime = currentDate.format("HH:mm");

    let finalAttendanceStatus = attendanceStatus;

    if (currentDay !== Repeat_On || currentTime > End_Time) {
      finalAttendanceStatus = "Absent";
    }

    const attendanceDate = currentDate.format("YYYY-MM-DD");
    const attendanceTime = currentDate.format("HH:mm:ss");

    await Attendance.create({
      enrolledclassID: enrolledClass.enrolledclassID,
      Status: finalAttendanceStatus,
      AttendanceDate: attendanceDate,
      AttendanceTime: attendanceTime,
    });

    res.json({ message: "Attendance status updated successfully!" });
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ error: "Error updating attendance" });
  }
};

exports.getParentChildrenAttendance = async (req, res) => {
  let token = req.headers["authorization"];

  if (!token) return res.status(403).json({ error: "No token provided" });
  if (token.startsWith("Bearer ")) token = token.slice(7, token.length);

  jwt.verify(token, "secret_key", async (err, decoded) => {
    if (err)
      return res.status(500).json({ error: "Failed to authenticate token" });

    const userID = decoded.UserID;

    try {
      const parent = await Parent.findOne({ where: { UserID: userID } });
      if (!parent) return res.status(404).json({ error: "ParentID not found" });

      const parentChildren = await ParentChild.findAll({
        where: { ParentID: parent.ParentID },
      });
      if (parentChildren.length === 0)
        return res
          .status(404)
          .json({ error: "No students found for this parent" });

      const studentIDs = parentChildren.map((pc) => pc.StudentID);

      const students = await Student.findAll({
        where: { StudentID: studentIDs },
      });
      if (students.length === 0)
        return res
          .status(404)
          .json({ error: "No UserID found for these students" });

      const userIDStudentMap = {};
      students.forEach((student) => {
        userIDStudentMap[student.UserID] = student.StudentID;
      });

      const userIDs = students.map((student) => student.UserID);

      const enrolledClasses = await EnrolledClass.findAll({
        where: { UserID: userIDs },
      });
      if (enrolledClasses.length === 0)
        return res
          .status(404)
          .json({ error: "No enrolled classes found for these users" });

      const enrolledClassIDs = enrolledClasses.map((ec) => ec.enrolledclassID);

      const attendances = await Attendance.findAll({
        where: { enrolledclassID: enrolledClassIDs },
      });
      if (attendances.length === 0)
        return res
          .status(404)
          .json({
            error: "No attendance records found for these enrolled classes",
          });

      const attendanceCount = {};
      const attendancePresentCount = {};

      attendances.forEach((att) => {
        const enrolledClassID = att.enrolledclassID;
        if (!attendanceCount[enrolledClassID]) {
          attendanceCount[enrolledClassID] = 0;
          attendancePresentCount[enrolledClassID] = 0;
        }
        attendanceCount[enrolledClassID]++;
        if (att.Status === "Present") {
          attendancePresentCount[enrolledClassID]++;
        }
      });

      const attendancePercentage = {};
      enrolledClasses.forEach((ec) => {
        const enrolledClassID = ec.enrolledclassID;
        const studentID = userIDStudentMap[ec.UserID];
        if (!attendancePercentage[studentID]) {
          attendancePercentage[studentID] = {
            totalClasses: 0,
            presentClasses: 0,
          };
        }
        attendancePercentage[studentID].totalClasses +=
          attendanceCount[enrolledClassID] || 0;
        attendancePercentage[studentID].presentClasses +=
          attendancePresentCount[enrolledClassID] || 0;
      });

      const attendancePercentageResults = Object.keys(attendancePercentage).map(
        (studentID) => {
          const { totalClasses, presentClasses } =
            attendancePercentage[studentID];
          const percentage =
            totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;
          return {
            StudentID: studentID,
            AttendancePercentage: percentage,
          };
        },
      );

      res.json(attendancePercentageResults);
    } catch (error) {
      console.error("Error fetching parent children attendance:", error);
      res
        .status(500)
        .json({ error: "Error fetching parent children attendance" });
    }
  });
};

// get tutor attendance chart
exports.getTutorAttendanceChart = async (req, res) => {
  let token = req.headers["authorization"];

  if (!token) return res.status(403).json({ error: "No token provided" });
  if (token.startsWith("Bearer ")) token = token.slice(7, token.length);

  jwt.verify(token, "secret_key", async (err, decoded) => {
    if (err)
      return res.status(500).json({ error: "Failed to authenticate token" });

    const userID = decoded.UserID;

    try {
      const tutor = await Tutor.findOne({ where: { UserID: userID } });
      if (!tutor) return res.status(404).json({ error: "TutorID not found" });

      const classes = await Class.findAll({
        where: { TutorID: tutor.TutorID },
      });
      const classIDs = classes.map((c) => c.ClassID);

      const enrolledClasses = await EnrolledClass.findAll({
        where: { ClassID: classIDs },
      });
      const totalStudentsCount = enrolledClasses.length;
      const enrolledClassIDs = enrolledClasses.map((ec) => ec.enrolledclassID);

      const currentDate = moment().tz("Asia/Colombo").format("YYYY-MM-DD");

      const attendances = await Attendance.findAll({
        where: {
          enrolledclassID: enrolledClassIDs,
          AttendanceDate: currentDate,
        },
      });

      const attendanceData = {
        present: 0,
        absent: 0,
      };

      attendances.forEach((att) => {
        if (att.Status === "Present") {
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
