const db = require("../Config/db");
const jwt = require('jsonwebtoken');

// get tutor classes
exports.getTutorClasses = (req, res) => {

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
  
        // Query to get classes related to the TutorID
        const getClassesQuery = 'SELECT Subject, Grade FROM class WHERE TutorID = ?';
  
        db.query(getClassesQuery, [tutorID], (error, results) => {
          if (error) {
            console.error("Error fetching classes:", error);
            return res.status(500).json({ error: 'Error fetching classes' });
          }
          res.json(results);
        });
      });
    });
  };


  
  //get student classes
  exports.getStudentClasses = (req, res) => {
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
  
      // Query to get ClassID from the enrolledclasses table using UserID
      const getClassIDQuery = 'SELECT ClassID FROM enrolledclasses WHERE UserID = ?';
  
      db.query(getClassIDQuery, [userID], (err, classResults) => {
        if (err) {
          console.error("Error fetching ClassID:", err);
          return res.status(500).json({ error: 'Error fetching ClassID' });
        }
  
        if (classResults.length === 0) {
          return res.status(404).json({ error: 'No classes found for this user' });
        }
  
        const classIDs = classResults.map(result => result.ClassID);
  
        // Query to get Subject, Grade, and TutorID from the class table using ClassID
        const getClassesQuery = 'SELECT ClassID, Subject, Grade, TutorID FROM class WHERE ClassID IN (?)';
  
        db.query(getClassesQuery, [classIDs], (error, results) => {
          if (error) {
            console.error("Error fetching classes:", error);
            return res.status(500).json({ error: 'Error fetching classes' });
          }
          res.json(results);
        });
      });
    });
  };

  
  