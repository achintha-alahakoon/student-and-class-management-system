const { Student, User, Tutor, EnrolledClass, Class, Payment, Attendance } = require("../Models");
const jwt = require("jsonwebtoken");

//get all student data
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [
        {
          model: User,
          attributes: ['username']
        }
      ]
    });
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Error fetching students" });
  }
};

//delete student data
exports.deleteStudent = async (req, res) => {
  const userId = req.params.userId;

  try {
    await Student.destroy({ where: { UserID: userId } });
    await User.destroy({ where: { UserID: userId } });
    res.json({ message: "Student and user data deleted successfully." });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ error: "Error deleting student" });
  }
};

//get student data by ID
exports.getStudentById = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const tenantId = req.user?.tenantId;  // ✅ Removed fallback to req.TenantID

    // ✅ Validate tenantId exists
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Authentication required"
      });
    }

    // Get student
    const student = await Student.findByPk(studentId, {
      attributes: [
        'StudentID', 'FirstName', 'LastName', 'Grade', 'Gender',
        'Birthday', 'Address', 'TelNo', 'Email', 'UserID', 'TenantID'
      ]
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // ✅ Verify student belongs to this tenant
    if (student.TenantID !== tenantId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Fetch all related data in parallel
    const [enrolledClasses, payments, attendance] = await Promise.all([
      EnrolledClass.findAll({
        where: { StudentID: studentId, TenantID: tenantId },
        include: [{ model: Class, attributes: ['ClassID', 'ClassName', 'Subject', 'Grade'] }]
      }),
      Payment.findAll({
        where: { StudentID: studentId, TenantID: tenantId },
        order: [['PaymentDate', 'DESC']]
      }),
      Attendance.findAll({
        include: [{
          model: EnrolledClass,
          where: { StudentID: studentId, TenantID: tenantId }
        }]
      })
    ]);

    res.json({
      success: true,
      data: {
        student: student,
        enrolledClasses: enrolledClasses.map(ec => ({
          enrolledclassID: ec.enrolledclassID,
          ClassID: ec.ClassID,
          ClassName: ec.class?.ClassName,
          Subject: ec.class?.Subject,
          Grade: ec.class?.Grade
        })),
        payments: payments,
        attendance: attendance.map(a => ({
          AttendanceID: a.AttendanceID,
          Status: a.Status,
          AttendanceDate: a.AttendanceDate,
          AttendanceTime: a.AttendanceTime,
          ClassID: a.enrolledclass?.ClassID
        }))
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//update student data (including username/password)
exports.updateStudent = async (req, res) => {
  // If the parameter contains a colon (like ":1"), strip it out just in case
  const selectedStudentId = req.params.selectedStudentId.replace(':', '');
  
  // Match the camelCase keys coming from the frontend request body
  const { firstName, lastName, grade, telephoneNumber, email, birthday, gender, address, username, password } = req.body;

  try {
    const student = await Student.findByPk(selectedStudentId, {
      attributes: ['StudentID', 'UserID']
    });

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: `No student found with ID ${selectedStudentId} to update.` 
      });
    }

    // Update Student table
    await Student.update(
      {
        FirstName: firstName,
        LastName: lastName,
        Gender: gender,
        Grade: grade,
        Birthday: birthday,
        TelNo: telephoneNumber,
        Email: email,
        Address: address
      },
      { 
        where: { StudentID: selectedStudentId } 
      }
    );

    // Update User table credentials if provided
    if (username || password) {
      const userUpdateData = {};
      
      if (username) {
        userUpdateData.username = username;
      }
      
      if (password) {
        const bcrypt = require("bcryptjs");
        userUpdateData.password = await bcrypt.hash(password, 10);
      }

      await User.update(userUpdateData, {
        where: { UserID: student.UserID }
      });
    }

    res.json({ success: true, message: "Student updated successfully" });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//get tutor student data
exports.getTutorStudents = async (req, res) => {
  let token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ error: 'No token provided' });
  }

  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length); // Remove Bearer prefix
  }

  jwt.verify(token, 'secret_key', async (err, decoded) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to authenticate token' });
    }

    const userID = decoded.UserID;

    try {
      const tutor = await Tutor.findOne({ where: { UserID: userID } });

      if (!tutor) {
        return res.status(404).json({ error: 'Tutor not found' });
      }

      const tutorID = tutor.TutorID;

      const enrolledClasses = await EnrolledClass.findAll({
        where: { TutorID: tutorID },
        attributes: ['StudentID']
      });

      const studentIds = enrolledClasses.map(ec => ec.StudentID);

      const students = await Student.findAll({
        where: { StudentID: studentIds },
        attributes: ['FirstName', 'LastName', 'Gender', 'Grade', 'StudentID']
      });

      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ error: 'Error fetching students' });
    }
  });
};
