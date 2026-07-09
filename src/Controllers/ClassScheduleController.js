const {
  Class,
  ClassSchedule,
  Tutor,
  EnrolledClass,
  Parent,
  ParentChild,
  Student,
} = require("../Models");
const db = require("../Config/db");

// Add class and class schedule
exports.addClass = async (req, res) => {
  const transaction = await db.transaction();

  try {
    const {
      name,
      grade,
      subject,
      tutorId,
      roomNumber,
      schedule,
      classFee,
      status,
      description,
    } = req.body;

    const tenantId = req.user.tenantId;

    // Validate tutor belongs to same tenant
    const tutor = await Tutor.findOne({
      where: {
        TutorID: tutorId,
        TenantID: tenantId,
      },
    });

    if (!tutor) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Tutor not found",
      });
    }

    // Create class
    const newClass = await Class.create(
      {
        ClassName: name,
        Subject: subject,
        Grade: grade,
        TutorID: tutorId,
        Fees: classFee,
        Description: description,
        isActive: status === "Active",
        TenantID: tenantId,
      },
      { transaction },
    );

    // Create schedules
    if (schedule?.days?.length > 0) {
      const schedules = schedule.days.map((day) => ({
        ScheduleDate: new Date(),
        Repeat_On: day,
        Start_Time: schedule.startTime,
        End_Time: schedule.endTime,
        Hall_Num: roomNumber,
        ClassID: newClass.ClassID,
        TenantID: tenantId,
      }));

      await ClassSchedule.bulkCreate(schedules, {
        transaction,
      });
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      classId: newClass.ClassID,
    });
  } catch (error) {
    await transaction.rollback();

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all scheduled classes
exports.getScheduledClasses = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const schedules = await ClassSchedule.findAll({
      where: { TenantID: tenantId },
      include: [
        {
          model: Class,
          attributes: [
            "ClassID",
            "ClassName",
            "Subject",
            "Grade",
            "TutorID",
            "isActive",
            "Description",
          ],
          include: [
            {
              model: Tutor,
              attributes: ["FirstName", "LastName"],
            },
          ],
        },
      ],
      order: [["Start_Time", "ASC"]],
    });

    // Get all enrolled classes for this tenant
    const enrolledClasses = await EnrolledClass.findAll({
      where: { TenantID: tenantId },
      attributes: ["ClassID"],
    });

    // Count students per ClassID
    const classStudentCounts = enrolledClasses.reduce((acc, ec) => {
      acc[ec.ClassID] = (acc[ec.ClassID] || 0) + 1;
      return acc;
    }, {});

    const results = schedules.map((schedule) => ({
      ClassID: schedule.class.ClassID,
      ClassName: schedule.class.ClassName,
      Subject: schedule.class.Subject,
      Grade: schedule.class.Grade,
      Tutor: schedule.class.tutor
        ? `${schedule.class.tutor.FirstName} ${schedule.class.tutor.LastName}`
        : "Unknown",
      TutorID: schedule.class.TutorID,
      Status: schedule.class.isActive,
      Description: schedule.class.Description,
      ScheduleID: schedule.ScheduleID,
      Repeat_On: schedule.Repeat_On,
      Hall_Num: schedule.Hall_Num,
      Start_Time: schedule.Start_Time,
      End_Time: schedule.End_Time,
      ScheduleDate: schedule.ScheduleDate,
      StudentCount: classStudentCounts[schedule.class.ClassID] || 0, // ✅ Added
    }));

    res.json(results);
  } catch (error) {
    console.error("Error fetching scheduled classes:", error);
    res.status(500).json({
      error: error.message || "Error fetching scheduled classes",
    });
  }
};

// Get available students for a class
exports.getAvailableStudents = async (req, res) => {

  const { classId } = req.params;
  const TenantID = req.user?.tenantId ?? req.TenantID;

  try {
    // ── Step 1: Get the class to find its grade ───────────
    const cls = await Class.findOne({
      where: { ClassID: classId, TenantID },
      attributes: ["ClassID", "Grade"],
    });

    if (!cls) {
      return res.status(404).json({ error: "Class not found" });
    }

    // ── Step 2: Get all students for this grade + tenant ──
    const allStudents = await Student.findAll({
      where: { Grade: cls.Grade, TenantID },
      attributes: [
        "StudentID",
        "FirstName",
        "LastName",
        "Grade",
        "Gender",
        "UserID",
      ],
    });

    // ── Step 3: Get already enrolled UserIDs ─────────────
    const enrolledRecords = await EnrolledClass.findAll({
      where: { ClassID: classId, TenantID },
      attributes: ["UserID"],
    });

    const enrolledUserIds = new Set(enrolledRecords.map((ec) => ec.UserID));

    // ── Step 4: Tag each student with isEnrolled ──────────
    const result = allStudents.map((s) => ({
      StudentID: s.StudentID,
      FirstName: s.FirstName,
      LastName: s.LastName,
      Grade: s.Grade,
      Gender: s.Gender,
      UserID: s.UserID,
      isEnrolled: enrolledUserIds.has(s.UserID),
    }));

    return res.status(200).json({
      status: "success",
      grade: cls.Grade,
      students: result,
    });
  } catch (error) {
    console.error("Error fetching students for class:", error);
    return res.status(500).json({
      error: error.message || "Error fetching students",
    });
  }
};

// Assign student to class
exports.assignStudentsToClass = async (req, res) => {
  const { classId } = req.params;
  const { userIds } = req.body;  // ✅ Changed from studentIds to userIds
  const tenantId = req.user?.tenantId;

  try {
    await Promise.all(
      userIds.map((userId) =>
        EnrolledClass.create({
          ClassID: classId,
          UserID: userId,
          TenantID: tenantId,
        })
      )
    );

    res.status(201).json({ message: "Students assigned to class successfully" });
  } catch (error) {
    console.error("Error assigning students to class:", error);
    res.status(500).json({
      error: error.message || "Error assigning students to class",
    });
  }
};


// Get scheduled class by ID
exports.getScheduledClassById = async (req, res) => {
  const { ScheduleID } = req.params;
  const tenantId = req.user?.tenantId;

  try {
    // Get schedule with class and tutor
    const schedule = await ClassSchedule.findOne({
      where: { ScheduleID, TenantID: tenantId },
      include: [
        {
          model: Class,
          attributes: [
            "ClassID",
            "ClassName",
            "Subject",
            "Grade",
            "TutorID",
            "isActive",
            "Description",
          ],
          include: [
            {
              model: Tutor,
              attributes: ["FirstName", "LastName"],
            },
          ],
        },
      ],
    });

    if (!schedule)
      return res.status(404).json({ error: "Class schedule not found" });

    // Get enrolled students for this class
    const enrolledClasses = await EnrolledClass.findAll({
      where: {
        ClassID: schedule.ClassID,
        TenantID: tenantId,
      },
    });

    // Get student details for enrolled users
    const userIds = enrolledClasses.map((ec) => ec.UserID);
    const students = await Student.findAll({
      where: { UserID: userIds, TenantID: tenantId },
      attributes: [
        "StudentID",
        "FirstName",
        "LastName",
        "Gender",
        "Grade",
        "Email",
        "TelNo",
        "UserID",
      ],
    });

    // Combine data
    const result = {
      ...schedule.toJSON(),
      enrolledStudents: students,
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching scheduled class by ID:", error);
    res.status(500).json({ error: "Error fetching scheduled class by ID" });
  }
};

// exports.getScheduledClassById = async (req, res) => {
//   const { ScheduleID } = req.params;
//   const tenantId = req.user?.tenantId;

//   try {
//     const schedule = await ClassSchedule.findOne({
//       where: { ScheduleID, TenantID: tenantId },
//       include: [
//         {
//           model: Class,
//           attributes: ['ClassID', 'ClassName', 'Subject', 'Grade', 'TutorID', 'isActive', 'Description'],
//           include: [
//             {
//               model: Tutor,
//               attributes: ['FirstName', 'LastName']
//             },
//             {
//               model: EnrolledClass,
//               where: { TenantID: tenantId },
//               include: [{
//                 model: Student,
//                 attributes: ['StudentID', 'FirstName', 'LastName', 'Gender', 'Grade', 'Email', 'TelNo']
//               }]
//             }
//           ]
//         }
//       ]
//     });

//     if (!schedule) return res.status(404).json({ error: "Class schedule not found" });

//     res.json(schedule);
//   } catch (error) {
//     console.error("Error fetching scheduled class by ID:", error);
//     res.status(500).json({ error: "Error fetching scheduled class by ID" });
//   }
// };

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
    const userID = req.user.userId;
    const tenantId = req.user.tenantId;

    try {
      const enrolledClasses = await EnrolledClass.findAll({
        where: { UserID: userID },
      });
      if (enrolledClasses.length === 0)
        return res
          .status(404)
          .json({ error: "No classes found for this user" });

      const classIDs = enrolledClasses.map((ec) => ec.ClassID);

      const schedules = await ClassSchedule.findAll({
        where: { ClassID: classIDs },
        include: [{ model: Class, attributes: ["Subject", "Grade", "Tutor"] }],
      });

      const results = schedules.map((schedule) => ({
        Subject: schedule.class.Subject,
        Grade: schedule.class.Grade,
        Tutor: schedule.class.Tutor,
        ScheduleID: schedule.ScheduleID,
        Repeat_On: schedule.Repeat_On,
        Hall_Num: schedule.Hall_Num,
        Start_Time: schedule.Start_Time,
        End_Time: schedule.End_Time,
      }));

      res.json(results);
    } catch (error) {
      console.error("Error fetching student schedule:", error);
      res.status(500).json({ error: "Error fetching student schedule" });
    }
};

// Get tutor scheduled classes
exports.getTutorScheduledClasses = async (req, res) => {
  const userID = req.user.userId;
  const tenantId = req.user.tenantId;

    try {
      const tutor = await Tutor.findOne({ where: { UserID: userID, TenantID: tenantId, } });
      if (!tutor)
        return res.status(500).json({ error: "Error fetching tutor details" });

      const classes = await Class.findAll({
        where: { TutorID: tutor.TutorID },
      });
      if (classes.length === 0)
        return res.status(500).json({ error: "Error fetching class details" });

      const classIDs = classes.map((c) => c.ClassID);

      const schedules = await ClassSchedule.findAll({
        where: { ClassID: classIDs },
        include: [{ model: Class, attributes: ["Subject", "Grade", "Tutor"] }],
      });

      const results = schedules.map((schedule) => ({
        ScheduleID: schedule.ScheduleID,
        ScheduleDate: schedule.ScheduleDate,
        Start_Time: schedule.Start_Time,
        Repeat_On: schedule.Repeat_On,
        Hall_Num: schedule.Hall_Num,
        End_Time: schedule.End_Time,
        ClassID: schedule.ClassID,
        Subject: schedule.class.Subject,
        Grade: schedule.class.Grade,
        Tutor: schedule.class.Tutor,
      }));

      res.status(200).json(results);
    } catch (error) {
      console.error("Error fetching scheduled classes:", error);
      res.status(500).json({ error: "Error fetching scheduled classes" });
    }
};

// get parent student scheduled classes
exports.getParentStudentScheduledClasses = async (req, res) => {
    const userID = req.user.userId;
    const tenantId = req.user.tenantId;

    try {
      const parent = await Parent.findOne({ where: { UserID: userID } });
      if (!parent)
        return res.status(500).json({ error: "Error fetching parent details" });

      const parentChild = await ParentChild.findOne({
        where: { ParentID: parent.ParentID },
      });
      if (!parentChild)
        return res
          .status(500)
          .json({ error: "Error fetching student details" });

      const student = await Student.findOne({
        where: { StudentID: parentChild.StudentID },
      });
      if (!student)
        return res.status(500).json({ error: "Error fetching user details" });

      const enrolledClasses = await EnrolledClass.findAll({
        where: { UserID: student.UserID },
      });
      if (enrolledClasses.length === 0)
        return res
          .status(404)
          .json({ error: "No classes found for this user" });

      const classIDs = enrolledClasses.map((ec) => ec.ClassID);

      const schedules = await ClassSchedule.findAll({
        where: { ClassID: classIDs },
        include: [{ model: Class, attributes: ["Subject", "Grade", "Tutor"] }],
      });

      const results = schedules.map((schedule) => ({
        Subject: schedule.class.Subject,
        Grade: schedule.class.Grade,
        Tutor: schedule.class.Tutor,
        ScheduleID: schedule.ScheduleID,
        Repeat_On: schedule.Repeat_On,
        Hall_Num: schedule.Hall_Num,
        Start_Time: schedule.Start_Time,
        End_Time: schedule.End_Time,
      }));

      res.json(results);
    } catch (error) {
      console.error("Error fetching student schedule:", error);
      res.status(500).json({ error: "Error fetching student schedule" });
    }
};
