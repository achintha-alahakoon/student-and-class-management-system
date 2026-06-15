const db = require("../Config/db");
const moment = require('moment-timezone');
const jwt = require("jsonwebtoken");

//get Attendance
exports.getAttendance = (req, res) => {
    const query = "SELECT StudentID, FirstName, LastName, Grade, UserID FROM student";
    db.query(query, (error, results) => {
        if (error) {
            console.error("Error fetching attendance:", error);
            res.status(500).json({ error: "Error fetching attendance" });
            return;
        }
        res.json(results);
    });
};



//get attendance by student

exports.getAttendanceByStudent = (req, res) => {
  const { studentId } = req.params;

  const userIdQuery = `
      SELECT UserID
      FROM student
      WHERE StudentID = ?;
  `;

  db.query(userIdQuery, [studentId], (error, userResults) => {
    if (error) {
      console.error("Error fetching user ID:", error);
      res.status(500).json({ error: "Error fetching user ID" });
      return;
    }

    if (userResults.length === 0) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    const userId = userResults[0].UserID;
    const currentDate = moment().tz('Asia/Colombo').format('YYYY-MM-DD'); // Get current date in Sri Lankan time in 'YYYY-MM-DD' format

    const attendanceQuery = `
      SELECT ec.enrolledclassID, ec.UserID, ec.ClassID, c.Subject, c.Grade, c.Tutor, 
      (SELECT Status 
       FROM attendance 
       WHERE enrolledclassID = ec.enrolledclassID AND AttendanceDate = ?) AS Status
      FROM enrolledclasses ec
      JOIN class c ON ec.ClassID = c.ClassID
      WHERE ec.UserID = ?;
    `;

    db.query(attendanceQuery, [currentDate, userId], (error, attendanceResults) => {
      if (error) {
        console.error("Error fetching attendance details:", error);
        res.status(500).json({ error: "Error fetching attendance details" });
        return;
      }

      res.json(attendanceResults);
    });
  });
};

  


// update attendance

// exports.updateAttendance = (req, res) => {
//     const { studentId, classId, attendanceStatus } = req.body;
  
//     const getUserIDQuery = `SELECT UserID FROM student WHERE StudentID = ?`;
//     db.query(getUserIDQuery, [studentId], (error, results) => {
//       if (error) {
//         console.error("Error fetching UserID:", error);
//         res.status(500).json({ error: "Error fetching UserID" });
//         return;
//       }
  
//       if (results.length === 0) {
//         res.status(404).json({ error: "StudentID not found" });
//         return;
//       }
  
//       const userID = results[0].UserID;
  
//       const getEnrolledClassIDQuery = `SELECT enrolledclassID FROM enrolledclasses WHERE UserID = ? AND ClassID = ?`;
//       db.query(getEnrolledClassIDQuery, [userID, classId], (error, results) => {
//         if (error) {
//           console.error("Error fetching enrolledclassID:", error);
//           res.status(500).json({ error: "Error fetching enrolledclassID" });
//           return;
//         }
  
//         if (results.length === 0) {
//           res.status(404).json({ error: "Enrollment not found for the given UserID and ClassID" });
//           return;
//         }
  
//         const enrolledclassID = results[0].enrolledclassID;
  
//         // Step 3: Insert the attendance record using Sri Lankan time
//         const currentDate = moment().tz('Asia/Colombo');
//         const attendanceDate = currentDate.format('YYYY-MM-DD');
//         const attendanceTime = currentDate.format('HH:mm:ss');
  
//         const insertAttendanceQuery = `INSERT INTO attendance (enrolledclassID, Status, AttendanceDate, AttendanceTime) VALUES (?, ?, ?, ?)`;
//         db.query(insertAttendanceQuery, [enrolledclassID, attendanceStatus, attendanceDate, attendanceTime], (error, results) => {
//           if (error) {
//             console.error("Error inserting attendance record:", error);
//             res.status(500).json({ error: "Error inserting attendance record" });
//             return;
//           }
  
//           res.json({ message: "Attendance status updated successfully!" });
//         });
//       });
//     });
//   };



exports.updateAttendance = (req, res) => {
  const { studentId, classId, attendanceStatus } = req.body;

  // Step 1: Fetch the UserID from the student table
  const getUserIDQuery = `SELECT UserID FROM student WHERE StudentID = ?`;
  db.query(getUserIDQuery, [studentId], (error, results) => {
    if (error) {
      console.error("Error fetching UserID:", error);
      res.status(500).json({ error: "Error fetching UserID" });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ error: "StudentID not found" });
      return;
    }

    const userID = results[0].UserID;

    // Step 2: Fetch the enrolledclassID from the enrolledclasses table
    const getEnrolledClassIDQuery = `SELECT enrolledclassID FROM enrolledclasses WHERE UserID = ? AND ClassID = ?`;
    db.query(getEnrolledClassIDQuery, [userID, classId], (error, results) => {
      if (error) {
        console.error("Error fetching enrolledclassID:", error);
        res.status(500).json({ error: "Error fetching enrolledclassID" });
        return;
      }

      if (results.length === 0) {
        res.status(404).json({ error: "Enrollment not found for the given UserID and ClassID" });
        return;
      }

      const enrolledclassID = results[0].enrolledclassID;

      // Step 3: Fetch the class schedule information from the classschedule table
      const getClassScheduleQuery = `
        SELECT Start_Time, End_Time, Repeat_On
        FROM classschedule
        WHERE ClassID = ?
      `;
      db.query(getClassScheduleQuery, [classId], (error, scheduleResults) => {
        if (error) {
          console.error("Error fetching class schedule:", error);
          res.status(500).json({ error: "Error fetching class schedule" });
          return;
        }

        if (scheduleResults.length === 0) {
          res.status(404).json({ error: "Class schedule not found" });
          return;
        }

        const { Start_Time, End_Time, Repeat_On } = scheduleResults[0];
        const currentDate = moment().tz('Asia/Colombo');
        const currentDay = currentDate.format('dddd'); // Get current day of the week
        const currentTime = currentDate.format('HH:mm'); // Get current time

        let finalAttendanceStatus = attendanceStatus;

        // Step 4: Check if the current day and time are within the class schedule
        if (currentDay !== Repeat_On || currentTime > End_Time) {
          finalAttendanceStatus = 'Absent';
        }

        // Step 5: Insert the attendance record
        const attendanceDate = currentDate.format('YYYY-MM-DD');
        const attendanceTime = currentDate.format('HH:mm:ss');

        const insertAttendanceQuery = `
          INSERT INTO attendance (enrolledclassID, Status, AttendanceDate, AttendanceTime)
          VALUES (?, ?, ?, ?)
        `;
        db.query(insertAttendanceQuery, [enrolledclassID, finalAttendanceStatus, attendanceDate, attendanceTime], (error, results) => {
          if (error) {
            console.error("Error inserting attendance record:", error);
            res.status(500).json({ error: "Error inserting attendance record" });
            return;
          }

          res.json({ message: "Attendance status updated successfully!" });
        });
      });
    });
  });
};



exports.getParentChildrenAttendance = (req, res) => {
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

      const getStudentIDQuery = 'SELECT StudentID FROM parentchildren WHERE ParentID = ?';

      db.query(getStudentIDQuery, [parentID], (err, studentResults) => {
        if (err) {
          console.error("Error fetching StudentID:", err);
          return res.status(500).json({ error: 'Error fetching StudentID' });
        }

        if (studentResults.length === 0) {
          return res.status(404).json({ error: 'No students found for this parent' });
        }

        const studentIDs = studentResults.map(result => result.StudentID);

        const getUserIDsQuery = 'SELECT UserID, StudentID FROM student WHERE StudentID IN (?)';

        db.query(getUserIDsQuery, [studentIDs], (err, userResults) => {
          if (err) {
            console.error("Error fetching UserID:", err);
            return res.status(500).json({ error: 'Error fetching UserID' });
          }

          if (userResults.length === 0) {
            return res.status(404).json({ error: 'No UserID found for these students' });
          }

          const userIDStudentMap = {};
          userResults.forEach(result => {
            userIDStudentMap[result.UserID] = result.StudentID;
          });

          const userIDs = userResults.map(result => result.UserID);

          const getEnrolledClassesQuery = 'SELECT enrolledclassID, UserID FROM enrolledclasses WHERE UserID IN (?)';

          db.query(getEnrolledClassesQuery, [userIDs], (err, enrolledClassResults) => {
            if (err) {
              console.error("Error fetching EnrolledClassID:", err);
              return res.status(500).json({ error: 'Error fetching EnrolledClassID' });
            }

            if (enrolledClassResults.length === 0) {
              return res.status(404).json({ error: 'No enrolled classes found for these users' });
            }

            const enrolledClassIDs = enrolledClassResults.map(result => result.enrolledclassID);

            const getAttendanceQuery = 'SELECT enrolledclassID, Status FROM attendance WHERE enrolledclassID IN (?)';

            db.query(getAttendanceQuery, [enrolledClassIDs], (err, attendanceResults) => {
              if (err) {
                console.error("Error fetching attendance status:", err);
                return res.status(500).json({ error: 'Error fetching attendance status' });
              }

              if (attendanceResults.length === 0) {
                return res.status(404).json({ error: 'No attendance records found for these enrolled classes' });
              }

              const attendanceCount = {};
              const attendancePresentCount = {};

              attendanceResults.forEach(result => {
                const enrolledClassID = result.enrolledclassID;
                if (!attendanceCount[enrolledClassID]) {
                  attendanceCount[enrolledClassID] = 0;
                  attendancePresentCount[enrolledClassID] = 0;
                }
                attendanceCount[enrolledClassID]++;
                if (result.Status === 'Present') {
                  attendancePresentCount[enrolledClassID]++;
                }
              });

              const attendancePercentage = {};
              enrolledClassResults.forEach(result => {
                const enrolledClassID = result.enrolledclassID;
                const userID = result.UserID;
                const studentID = userIDStudentMap[userID];
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
            });
          });
        });
      });
    });
  });
};






// get tutor attendance chart


exports.getTutorAttendanceChart = (req, res) => {
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

    // Get TutorID from the tutor table using UserID
    const getTutorIDQuery = `SELECT TutorID FROM tutor WHERE UserID = ?`;
    db.query(getTutorIDQuery, [userID], (error, tutorResults) => {
      if (error) {
        console.error("Error fetching TutorID:", error);
        return res.status(500).json({ error: "Error fetching TutorID" });
      }

      if (tutorResults.length === 0) {
        return res.status(404).json({ error: "TutorID not found" });
      }

      const tutorID = tutorResults[0].TutorID;

      // Get ClassID from the class table using TutorID
      const getClassIDQuery = `SELECT ClassID FROM class WHERE TutorID = ?`;
      db.query(getClassIDQuery, [tutorID], (error, classResults) => {
        if (error) {
          console.error("Error fetching ClassID:", error);
          return res.status(500).json({ error: "Error fetching ClassID" });
        }

        const classIDs = classResults.map(row => row.ClassID);

        // Get enrolledclassID and total student count from the enrolledclasses table using ClassID
        const getEnrolledClassIDQuery = `SELECT enrolledclassID, UserID FROM enrolledclasses WHERE ClassID IN (?)`;
        db.query(getEnrolledClassIDQuery, [classIDs], (error, enrolledResults) => {
          if (error) {
            console.error("Error fetching enrolledclassID:", error);
            return res.status(500).json({ error: "Error fetching enrolledclassID" });
          }

          const totalStudentsCount = enrolledResults.length;
          const enrolledClassIDs = enrolledResults.map(row => row.enrolledclassID);

          // Get attendance status from the attendance table using enrolledclassID and current date
          const currentDate = moment().tz('Asia/Colombo').format('YYYY-MM-DD');
          const getAttendanceStatusQuery = `
            SELECT Status, COUNT(*) as count
            FROM attendance
            WHERE enrolledclassID IN (?) AND AttendanceDate = ?
            GROUP BY Status
          `;
          db.query(getAttendanceStatusQuery, [enrolledClassIDs, currentDate], (error, attendanceResults) => {
            if (error) {
              console.error("Error fetching attendance status:", error);
              return res.status(500).json({ error: "Error fetching attendance status" });
            }

            const attendanceData = {
              present: 0,
              absent: 0
            };

            attendanceResults.forEach(row => {
              if (row.Status === 'Present') {
                attendanceData.present = row.count;
              }
            });

            attendanceData.absent = totalStudentsCount - attendanceData.present;

            return res.json(attendanceData);
          });
        });
      });
    });
  });
};
