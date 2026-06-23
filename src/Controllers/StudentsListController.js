const { Student, User, Tutor, EnrolledClass } = require("../Models");
const jwt = require("jsonwebtoken");

//get all student data
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.findAll();
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

//get single student data
exports.getStudent = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const student = await Student.findByPk(studentId, { attributes: ['FirstName'] });

    if (student) {
      res.json({ success: true, FirstName: student.FirstName });
    } else {
      res.status(404).json({ success: false, message: "Student not found" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//update student data
exports.updateStudent = async (req, res) => {
  const selectedUserId = req.params.selectedUserId;
  const { firstName, lastName, gender, birthday, address, telephoneNumber, email } = req.body;

  try {
    await Student.update(
      {
        FirstName: firstName,
        LastName: lastName,
        Gender: gender,
        Birthday: birthday,
        Address: address,
        TelNo: telephoneNumber,
        Email: email
      },
      { where: { UserID: selectedUserId } }
    );
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
        attributes: ['UserID']
      });

      const userIDs = enrolledClasses.map(ec => ec.UserID);

      const students = await Student.findAll({
        where: { UserID: userIDs },
        attributes: ['FirstName', 'LastName', 'Gender', 'Grade', 'StudentID']
      });

      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ error: 'Error fetching students' });
    }
  });
};
