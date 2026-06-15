const db = require("../Config/db");
const jwt = require("jsonwebtoken");

//get all student data
exports.getAllStudents = (req, res) => {
    const query = "SELECT * FROM student";
    db.query(query, (error, results) => {
      if (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ error: "Error fetching students" });
        return;
      }
      res.json(results);
    });
  };

  //delete student data
  exports.deleteStudent = (req, res) => {
    const userId = req.params.userId;

    const studentQuery = "DELETE FROM student WHERE UserID = ?";
    const userQuery = "DELETE FROM user WHERE UserID = ?";
    db.query(studentQuery, [userId], (error, studentResult) => {
        if (error) {
            console.error("Error deleting student:", error);
            return res.status(500).json({ error: "Error deleting student", error });
        }
        db.query(userQuery, [userId], (error, userResult) => {
            if (error) {
                console.error("Error deleting user:", error);
                return res.status(500).json({ error: "Error deleting user" });
            }
            res.json({ message: "Student and user data deleted successfully." });
        });
    });
};

//get single student data

exports.getStudent = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    // Query to fetch student by studentId
    const query = "SELECT FirstName FROM student WHERE StudentID = ?";
    // Execute the query
    db.query(query, [studentId], (error, results) => {
      if (error) {
        console.error("Error fetching student:", error);
        res.status(500).json({ success: false, message: "Server error" });
        return;
      }
      // Check if student exists
      if (results.length > 0) {
        res.json({ success: true, FirstName: results[0].FirstName });
      } else {
        res.status(404).json({ success: false, message: "Student not found" });
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



//update student data

exports.updateStudent = (req, res) => {
  const selectedUserId = req.params.selectedUserId;
  console.log(selectedUserId);
  console.log(req.body);
  const { firstName, lastName, gender, birthday, address, telephoneNumber, email } = req.body; // Updated parameter names here
  const query = "UPDATE student SET FirstName = ?, LastName = ?, Gender = ?, Birthday = ?, Address = ?, TelNo = ?, Email = ? WHERE UserID = ?";
  db.query(query, [ firstName, lastName, gender, birthday, address, telephoneNumber, email, selectedUserId ], (error, results) => {
    if (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ success: false, message: "Server error" });
      return;
    }
    res.json({ success: true, message: "Student updated successfully" });
  });
}



//get tutor student data

exports.getTutorStudents = (req, res) => {
  let token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ error: 'No token provided' });
  }

  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length); // Remove Bearer prefix
  }

  jwt.verify(token, 'secret_key', (err, decoded) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to authenticate token' });
    }

    const userID = decoded.UserID;

    // Query to get the TutorID from the UserID
    const getTutorIDQuery = 'SELECT TutorID FROM tutor WHERE UserID = ?';
    
    db.query(getTutorIDQuery, [userID], (err, tutorResults) => {
      if (err) {
        console.error("Error fetching TutorID:", err);
        return res.status(500).json({ error: 'Error fetching TutorID' });
      }

      if (tutorResults.length === 0) {
        return res.status(404).json({ error: 'TutorID not found' });
      }

      const tutorID = tutorResults[0].TutorID;

      // Query to get students related to the TutorID
      const query = `
        SELECT FirstName, LastName, Gender, Grade, StudentID 
        FROM student 
        WHERE UserID IN (
          SELECT UserID 
          FROM enrolledclasses 
          WHERE TutorID = ?
        )`;

      db.query(query, [tutorID], (error, results) => {
        if (error) {
          console.error("Error fetching students:", error);
          return res.status(500).json({ error: 'Error fetching students' });
        }
        res.json(results);
      });
    });
  });
};



