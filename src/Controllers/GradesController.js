const db = require("../Config/db");
const jwt = require("jsonwebtoken");

// upload grades

exports.addGrades = (req, res) => {
    const { StudentID, assignmentTypeID, classID, grade, feedback } = req.body;
  
    // First, get the AssignmentsID from the assignments table
    db.query(
      'SELECT AssignmentsID FROM assignments WHERE ClassID = ? AND assignment_type_id = ?',
      [classID, assignmentTypeID],
      (error, assignmentResults) => {
        if (error) {
          console.error('Error fetching AssignmentsID:', error);
          res.status(500).send('Error fetching AssignmentsID');
          return;
        }
  
        if (assignmentResults.length === 0) {
          res.status(404).send('Assignment not found');
          return;
        }
  
        const AssignmentsID = assignmentResults[0].AssignmentsID;
  
        // Insert data into the grades table
        db.query(
          'INSERT INTO grades (StudentID, AssignmentsID, Grade, Feedback) VALUES (?, ?, ?, ?)',
          [StudentID, AssignmentsID, grade, feedback],
          (error) => {
            if (error) {
              console.error('Error adding grade:', error);
              res.status(500).send('Error adding grade');
              return;
            }
  
            res.status(200).send('Grade added successfully');
          }
        );
      }
    );
};


// get grades
exports.getGrades = (req, res) => {
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

    // First, get the StudentID using the UserID
    const getStudentIdQuery = 'SELECT StudentID FROM student WHERE UserID = ?';
    db.query(getStudentIdQuery, [userID], (error, studentResults) => {
      if (error) {
        console.error('Error fetching StudentID:', error);
        return res.status(500).send('Error fetching StudentID');
      }

      if (studentResults.length === 0) {
        return res.status(404).send('Student not found');
      }

      const studentID = studentResults[0].StudentID;

      // Get the grades along with assignment details and subject from class table
      const getGradesQuery = `
        SELECT 
          g.GradeID,
          g.StudentID,
          g.AssignmentsID,
          g.Grade,
          a.assignment_name,
          a.UploadDate,
          a.ClassID,
          c.Subject
        FROM 
          grades g
        JOIN 
          assignments a ON g.AssignmentsID = a.AssignmentsID
        JOIN 
          class c ON a.ClassID = c.ClassID
        WHERE 
          g.StudentID = ?;
      `;

      db.query(getGradesQuery, [studentID], (error, gradeResults) => {
        if (error) {
          console.error('Error fetching grades:', error);
          return res.status(500).send('Error fetching grades');
        }

        if (gradeResults.length === 0) {
          return res.status(200).json({ success: true, message: 'No results yet', data: [] });
        }

        res.status(200).json({ success: true, data: gradeResults });
      });
    });
  });
};




// get parent student grades
exports.getParentStudentgrades = (req, res) => {
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

    // Get StudentID using the ParentID from parent table
    const getStudentIdQuery = 'SELECT StudentNo FROM parent WHERE UserID = ?';
    db.query(getStudentIdQuery, [userID], (error, studentResults) => {
      if (error) {
        console.error('Error fetching StudentID:', error);
        return res.status(500).send('Error fetching StudentID');
      }

      if (studentResults.length === 0) {
        return res.status(404).send('Student not found');
      }

      const studentID = studentResults[0].StudentNo;

      // Get the grades along with assignment details and subject from class table
      const getGradesQuery = `
        SELECT 
          g.GradeID,
          g.StudentID,
          g.AssignmentsID,
          g.Grade,
          a.assignment_name,
          a.UploadDate,
          a.ClassID,
          c.Subject
        FROM 
          grades g
        JOIN 
          assignments a ON g.AssignmentsID = a.AssignmentsID
        JOIN 
          class c ON a.ClassID = c.ClassID
        WHERE 
          g.StudentID = ?;
      `;

      db.query(getGradesQuery, [studentID], (error, gradeResults) => {
        if (error) {
          console.error('Error fetching grades:', error);
          return res.status(500).send('Error fetching grades');
        }
        if (gradeResults.length === 0) {
          return res.status(404).send('No grades found');
        }

        res.status(200).json({ success: true, data: gradeResults });
      });
    });
  });
};


exports.getGradeHistory = (req, res) => {
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

    // Get TutorID from tutor table
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

      // Get UserID from enrolledclasses table related to TutorID
      const getUserIDsQuery = `
        SELECT ec.UserID
        FROM enrolledclasses ec
        JOIN class c ON ec.ClassID = c.ClassID
        WHERE c.TutorID = ?`;
      db.query(getUserIDsQuery, [tutorID], (err, enrolledResults) => {
        if (err) {
          console.error("Error fetching UserID:", err);
          return res.status(500).json({ error: 'Error fetching UserID' });
        }

        if (enrolledResults.length === 0) {
          return res.status(404).json({ error: 'No students found for this tutor' });
        }

        const userIDs = enrolledResults.map(row => row.UserID);

        // Get StudentID, FirstName, and LastName from student table
        const getStudentDetailsQuery = 'SELECT StudentID, FirstName, LastName FROM student WHERE UserID IN (?)';
        db.query(getStudentDetailsQuery, [userIDs], (err, studentResults) => {
          if (err) {
            console.error("Error fetching student details:", err);
            return res.status(500).json({ error: 'Error fetching student details' });
          }

          if (studentResults.length === 0) {
            return res.status(404).json({ error: 'No students found' });
          }

          const studentIDs = studentResults.map(student => student.StudentID);
          const studentDetailsMap = studentResults.reduce((map, student) => {
            map[student.StudentID] = {
              FirstName: student.FirstName,
              LastName: student.LastName
            };
            return map;
          }, {});

          // Get AssignmentsID, Grade, and Feedback from grades table
          const getGradesQuery = 'SELECT AssignmentsID, StudentID, Grade, Feedback FROM grades WHERE StudentID IN (?)';
          db.query(getGradesQuery, [studentIDs], (err, gradeResults) => {
            if (err) {
              console.error("Error fetching grades:", err);
              return res.status(500).json({ error: 'Error fetching grades' });
            }

            if (gradeResults.length === 0) {
              return res.status(404).json({ error: 'No grades found' });
            }

            const assignmentIDs = gradeResults.map(grade => grade.AssignmentsID);
            const gradeDetailsMap = gradeResults.reduce((map, grade) => {
              if (!map[grade.AssignmentsID]) {
                map[grade.AssignmentsID] = [];
              }
              map[grade.AssignmentsID].push({
                StudentID: grade.StudentID,
                Grade: grade.Grade,
                Feedback: grade.Feedback
              });
              return map;
            }, {});

            // Get ClassID and assignment_name from assignments table
            const getAssignmentsQuery = 'SELECT AssignmentsID, ClassID, assignment_name FROM assignments WHERE AssignmentsID IN (?)';
            db.query(getAssignmentsQuery, [assignmentIDs], (err, assignmentResults) => {
              if (err) {
                console.error("Error fetching assignments:", err);
                return res.status(500).json({ error: 'Error fetching assignments' });
              }

              if (assignmentResults.length === 0) {
                return res.status(404).json({ error: 'No assignments found' });
              }

              const classIDs = assignmentResults.map(assignment => assignment.ClassID);
              const assignmentDetailsMap = assignmentResults.reduce((map, assignment) => {
                map[assignment.AssignmentsID] = {
                  ClassID: assignment.ClassID,
                  assignment_name: assignment.assignment_name
                };
                return map;
              }, {});

              // Get Grade from class table
              const getClassDetailsQuery = 'SELECT ClassID, Grade FROM class WHERE ClassID IN (?)';
              db.query(getClassDetailsQuery, [classIDs], (err, classResults) => {
                if (err) {
                  console.error("Error fetching class details:", err);
                  return res.status(500).json({ error: 'Error fetching class details' });
                }

                if (classResults.length === 0) {
                  return res.status(404).json({ error: 'No class details found' });
                }

                const classDetailsMap = classResults.reduce((map, cls) => {
                  map[cls.ClassID] = {
                    Grade: cls.Grade
                  };
                  return map;
                }, {});

                // Compile final result
                const gradeHistory = [];

                for (const [assignmentsID, gradeEntries] of Object.entries(gradeDetailsMap)) {
                  const assignmentDetails = assignmentDetailsMap[assignmentsID];
                  const classDetails = classDetailsMap[assignmentDetails.ClassID];

                  gradeEntries.forEach(gradeEntry => {
                    const studentDetails = studentDetailsMap[gradeEntry.StudentID];
                    gradeHistory.push({
                      StudentID: gradeEntry.StudentID,
                      FirstName: studentDetails.FirstName,
                      LastName: studentDetails.LastName,
                      AssignmentsID: assignmentsID,
                      Grade: gradeEntry.Grade,
                      Feedback: gradeEntry.Feedback,
                      ClassID: assignmentDetails.ClassID,
                      assignment_name: assignmentDetails.assignment_name,
                      GradeLevel: classDetails.Grade
                    });
                  });
                }

                res.status(200).json(gradeHistory);
              });
            });
          });
        });
      });
    });
  });
};