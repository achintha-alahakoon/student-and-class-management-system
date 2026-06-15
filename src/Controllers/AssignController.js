const db = require("../Config/db");
const jwt = require("jsonwebtoken");

// assign student to class
exports.assignStudent = (req, res) => {
    const { studentID, grade, subject, tutor } = req.body;
  
    // Step 1: Fetch the UserID related to the studentID
    const userQuery = 'SELECT UserID FROM student WHERE StudentID = ?';
    
    db.query(userQuery, [studentID], (err, userResult) => {
      if (err) {
        console.error('Error fetching user ID:', err);
        return res.status(500).json({ error: 'Error fetching user ID' });
      } else if (userResult.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      } else {
        const userID = userResult[0].UserID;
  
        // Step 2: Fetch the ClassID and TutorID based on grade, subject, and tutor
        const classQuery = 'SELECT ClassID, TutorID FROM class WHERE Grade = ? AND Subject = ? AND Tutor = ?';
        
        db.query(classQuery, [grade, subject, tutor], (err, classResult) => {
          if (err) {
            console.error('Error fetching class ID:', err);
            return res.status(500).json({ error: 'Error fetching class ID' });
          } else if (classResult.length === 0) {
            return res.status(404).json({ error: 'Class not found' });
          } else {
            const classID = classResult[0].ClassID;
            const tutorID = classResult[0].TutorID;
  
            // Step 3: Enroll the student in the class
            const enrollQuery = 'INSERT INTO enrolledclasses (UserID, ClassID, TutorID) VALUES (?, ?, ?)';
            
            db.query(enrollQuery, [userID, classID, tutorID], (err, enrollResult) => {
              if (err) {
                console.error('Error assigning student to class:', err);
                return res.status(500).json({ error: 'Error assigning student to class' });
              } else {
                return res.json({ message: 'Student assigned to class successfully' });
              }
            });
          }
        });
      }
    });
  }
  

// assign tutor to class
exports.assignTutor = (req, res) => {
    const { tutorID, grade, subject, fees } = req.body;
  
    // Query to fetch the first name and last name of the tutor
    const tutorQuery = 'SELECT FirstName, LastName FROM tutor WHERE TutorID = ?';
  
    db.query(tutorQuery, [tutorID], (err, result) => {
      if (err) {
        console.error('Error fetching tutor details:', err);
        res.status(500).json({ error: 'Error fetching tutor details' });
      } else if (result.length === 0) {
        res.status(404).json({ error: 'Tutor not found' });
      } else {
        const firstName = result[0].FirstName;
        const lastName = result[0].LastName;
        const tutorName = `${firstName} ${lastName}`;
  
        // Query to insert a new class into the class table
        const insertClassQuery = 'INSERT INTO class (Subject, Grade, TutorID, Tutor, Fees) VALUES (?, ?, ?, ?, ?)';
        db.query(insertClassQuery, [subject, grade, tutorID, tutorName, fees], (err, result) => {
          if (err) {
            console.error('Error adding tutor to class:', err);
            res.status(500).json({ error: 'Error adding tutor to class' });
          } else {
            res.json({ message: `Tutor ${tutorName} added to class successfully` });
          }
        });
      }
    });
}





// get student details
exports.getStudents = (req, res) => {
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
  
      const getParentIDQuery = 'SELECT ParentID FROM parent WHERE UserID = ?';
      
      db.query(getParentIDQuery, [userID], (err, parentResults) => {
        if (err) {
          console.error("Error fetching ParentID:", err);
          return res.status(500).json({ error: 'Error fetching ParentID' });
        }
  
        if (parentResults.length === 0) {
          return res.status(404).json({ error: 'ParentID not found' });
        }
  
        const parentID = parentResults[0].ParentID;
  
        const getStudentDetailsQuery = 'SELECT * FROM parentchildren WHERE ParentID = ?';
        
        db.query(getStudentDetailsQuery, [parentID], (error, results) => {
          if (error) {
            console.error("Error fetching student details:", error);
            return res.status(500).json({ error: 'Error fetching student details' });
          }
          res.json(results);
        });
      });
    });
};