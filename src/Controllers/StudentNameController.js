const db = require("../Config/db");
const jwt = require("jsonwebtoken");

// get student name
exports.getStudentName = (req, res) => {
    let token = req.headers['authorization'];
  
    if (!token) {
      return res.status(403).json({ error: 'No token provided' });
    }
  
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length); // Remove Bearer prefix
    }
  
    jwt.verify(token, 'secret_key', (err, decoded) => {
      if (err) {
        console.error("Failed to authenticate token:", err);
        return res.status(500).json({ error: 'Failed to authenticate token' });
      }
  
      const userID = decoded.UserID;
  
      // Query to get the first name and last name of the student
      const getStudentNameQuery = 'SELECT FirstName, LastName FROM student WHERE UserID = ?';
  
      db.query(getStudentNameQuery, [userID], (err, results) => {
        if (err) {
          console.error("Error fetching student's name:", err);
          return res.status(500).json({ error: 'Error fetching student\'s name' });
        }
  
        if (results.length === 0) {
          return res.status(404).json({ error: 'Student not found' });
        }
  
        const { FirstName, LastName } = results[0];
        res.json({ firstName: FirstName, lastName: LastName });
      });
    });
  };


  // get parent name
  exports.getParentName = (req, res) => {
    let token = req.headers['authorization'];
  
    if (!token) {
      return res.status(403).json({ error: 'No token provided' });
    }
  
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length); // Remove Bearer prefix
    }
  
    jwt.verify(token, 'secret_key', (err, decoded) => {
      if (err) {
        console.error("Failed to authenticate token:", err);
        return res.status(500).json({ error: 'Failed to authenticate token' });
      }
  
      const userID = decoded.UserID;
  
      // Query to get the first name and last name of the parent
      const getParentNameQuery = 'SELECT FirstName, LastName FROM parent WHERE UserID = ?';
  
      db.query(getParentNameQuery, [userID], (err, results) => {
        if (err) {
          console.error("Error fetching parent's name:", err);
          return res.status(500).json({ error: 'Error fetching parent\'s name' });
        }
  
        if (results.length === 0) {
          return res.status(404).json({ error: 'Parent not found' });
        }
  
        const { FirstName, LastName } = results[0];
        res.json({ firstName: FirstName, lastName: LastName });
      });
    });
  };


  

exports.getParentsStudent = (req, res) => {
  const { ParentID, StudentID } = req.params;
  let token = req.headers['authorization'];

  if (!token) {
      return res.status(403).json({ error: 'No token provided' });
  }

  if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length); // Remove Bearer prefix
  }

  jwt.verify(token, 'secret_key', (err, decoded) => { // Replace 'secret_key' with your actual secret key
      if (err) {
          console.error("Failed to authenticate token:", err);
          return res.status(500).json({ error: 'Failed to authenticate token' });
      }

      const userID = decoded.UserID;

      const getParentIDQuery = 'SELECT ParentID FROM parent WHERE UserID = ?';
      db.query(getParentIDQuery, [userID], (err, results) => {
          if (err) {
              console.error("Error fetching parent's ID:", err);
              return res.status(500).json({ error: 'Error fetching parent\'s ID' });
          }

          if (results.length === 0) {
              return res.status(404).json({ error: 'Parent not found' });
          }

          const parentIDFromToken = results[0].ParentID;

          // Ensure both ParentID values are strings and trimmed
          if (String(parentIDFromToken).trim() !== String(ParentID).trim()) {
              return res.status(403).json({ error: 'ParentID does not match. You cannot add this student.' });
          }

          // Fetch student details based on StudentID
          const getStudentDetailsQuery = 'SELECT FirstName, LastName, Grade FROM student WHERE StudentID = ?';
          db.query(getStudentDetailsQuery, [StudentID], (err, results) => {
              if (err) {
                  console.error("Error fetching student's details:", err);
                  return res.status(500).json({ error: 'Error fetching student\'s details' });
              }

              if (results.length === 0) {
                  return res.status(404).json({ error: 'Student not found' });
              }

              const { FirstName, LastName, Grade } = results[0];

              // Insert data into parentchildren table
              const insertParentChildQuery = 'INSERT INTO parentchildren (ParentID, StudentID, FirstName, LastName, Grade) VALUES (?, ?, ?, ?, ?)';
              db.query(insertParentChildQuery, [ParentID, StudentID, FirstName, LastName, Grade], (err, result) => {
                  if (err) {
                      console.error("Error inserting into parentchildren table:", err);
                      return res.status(500).json({ error: 'You have already added that Student..!' });
                  }

                  // Fetch data from parentchildren table based on ParentIDs and StudentID
                  const fetchParentChildrenQuery = 'SELECT FirstName, LastName, Grade FROM parentchildren WHERE ParentID IN (?, ?) AND StudentID = ?';
                  db.query(fetchParentChildrenQuery, [parentIDFromToken, ParentID, StudentID], (err, results) => {
                      if (err) {
                          console.error("Error fetching parent's children:", err);
                          return res.status(500).json({ error: 'Error fetching parent\'s children' });
                      }

                      res.json({ parentChildren: results });
                  });
              });
          });
      });
  });
};

