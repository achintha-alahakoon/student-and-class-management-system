const db = require("../Config/db");
const jwt = require("jsonwebtoken");

// Add class and class schedule

exports.addClass = (req, res) => {
  const {
    startDate,
    grade,
    repeatOn,
    hallNumber,
    startTime,
    endTime,
    tutor,
    subject,
  } = req.body;

  // Check if the class with the given Subject, Grade, and Tutor already exists
  const checkClassQuery =
    "SELECT ClassID FROM class WHERE Grade = ? AND Tutor = ? AND Subject = ?";
  db.query(checkClassQuery, [grade, tutor, subject], (error, classResults) => {
    if (error) {
      console.error("Error checking class:", error);
      return res.status(500).json({ error: "Error checking class" });
    }

    if (classResults.length === 0) {
      // If no such class exists, return an error
      return res
        .status(400)
        .json({
          error:
            "Class with the specified Grade, Tutor, and Subject does not exist",
        });
    }

    // Extract the existing ClassID
    const classId = classResults[0].ClassID;

    // Insert class schedule details into the `classschedule` table
    const classScheduleQuery =
      "INSERT INTO classschedule (ScheduleDate, Start_Time, Repeat_On, Hall_Num, End_Time, ClassID) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(
      classScheduleQuery,
      [startDate, startTime, repeatOn, hallNumber, endTime, classId],
      (error, scheduleResults) => {
        if (error) {
          console.error("Error adding class schedule:", error);
          return res.status(500).json({ error: "Error adding class schedule" });
        }

        res.status(200).json({ message: "Class schedule added successfully" });
      }
    );
  });
};

// Get all scheduled classes

exports.getSchedule = (req, res) => {
  const getScheduledClassesQuery = `
      SELECT class.Subject, class.Grade, class.Tutor, classschedule.ScheduleID, classschedule.Repeat_On, classschedule.Hall_Num, classschedule.Start_Time, classschedule.End_Time
      FROM class
      INNER JOIN classschedule ON class.ClassID = classschedule.ClassID
    `;

  db.query(getScheduledClassesQuery, (error, results) => {
    if (error) {
      console.error("Error fetching scheduled classes:", error);
      res.status(500).json({ error: "Error fetching scheduled classes" });
      return;
    }
    res.json(results);
  });
};

//Delete class schedule

exports.deleteScheduleClass = (req, res) => {
  const { ScheduleID } = req.params;

  const deleteClassQuery = "DELETE FROM classschedule WHERE ScheduleID = ?";
  db.query(deleteClassQuery, [ScheduleID], (error, results) => {
    if (error) {
      console.error("Error deleting class schedule:", error);
      return res.status(500).json({ error: "Error deleting class schedule" });
    }
    res.json({ message: "Class schedule deleted successfully" });
  });
};

// get student schedule
exports.getStudentSchedule = (req, res) => {
  let token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ error: "No token provided" });
  }

  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length); // Remove Bearer prefix
  }

  jwt.verify(token, "secret_key", (err, decoded) => {
    if (err) {
      return res.status(500).json({ error: "Failed to authenticate token" });
    }

    const userID = decoded.UserID;

    // Query to get ClassID from the enrolledclasses table using UserID
    const getClassIDQuery =
      "SELECT ClassID FROM enrolledclasses WHERE UserID = ?";

    db.query(getClassIDQuery, [userID], (err, classResults) => {
      if (err) {
        console.error("Error fetching ClassID:", err);
        return res.status(500).json({ error: "Error fetching ClassID" });
      }

      if (classResults.length === 0) {
        return res
          .status(404)
          .json({ error: "No classes found for this user" });
      }

      const classIDs = classResults.map((result) => result.ClassID);

      // Query to get scheduled class details from classschedule using ClassID
      const getStudentScheduleQuery = `
          SELECT class.Subject, class.Grade, class.Tutor, classschedule.ScheduleID, classschedule.Repeat_On, classschedule.Hall_Num, classschedule.Start_Time, classschedule.End_Time
          FROM class
          INNER JOIN classschedule ON class.ClassID = classschedule.ClassID
          WHERE class.ClassID IN (?)
        `;

      db.query(getStudentScheduleQuery, [classIDs], (error, results) => {
        if (error) {
          console.error("Error fetching student schedule:", error);
          return res
            .status(500)
            .json({ error: "Error fetching student schedule" });
        }
        res.json(results);
      });
    });
  });
};

// Get tutor scheduled classes
exports.getTutorScheduledClasses = (req, res) => {
  let token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ error: "No token provided" });
  }

  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length); // Remove Bearer prefix
  }

  jwt.verify(token, "secret_key", (err, decoded) => {
    if (err) {
      return res.status(500).json({ error: "Failed to authenticate token" });
    }

    const userID = decoded.UserID;

    // Get TutorID from tutor table based on UserID
    const tutorQuery = "SELECT TutorID FROM tutor WHERE UserID = ?";
    db.query(tutorQuery, [userID], (err, tutorResults) => {
      if (err || tutorResults.length === 0) {
        return res.status(500).json({ error: "Error fetching tutor details" });
      }

      const tutorID = tutorResults[0].TutorID;

      // Get class details from class table based on TutorID
      const classQuery =
        "SELECT ClassID, Subject, Grade, Tutor FROM class WHERE TutorID = ?";
      db.query(classQuery, [tutorID], (err, classResults) => {
        if (err || classResults.length === 0) {
          return res
            .status(500)
            .json({ error: "Error fetching class details" });
        }

        const classIDs = classResults.map((classItem) => classItem.ClassID);

        // Get scheduled class details from classschedule table based on ClassID
        const scheduleQuery =
          "SELECT * FROM classschedule WHERE ClassID IN (?)";
        db.query(scheduleQuery, [classIDs], (err, scheduleResults) => {
          if (err) {
            return res
              .status(500)
              .json({ error: "Error fetching scheduled classes" });
          }

          // Combine class and schedule data
          const combinedData = scheduleResults.map((schedule) => {
            const classInfo = classResults.find(
              (classItem) => classItem.ClassID === schedule.ClassID
            );
            return {
              ...schedule,
              Subject: classInfo.Subject,
              Grade: classInfo.Grade,
              Tutor: classInfo.Tutor,
            };
          });

          res.status(200).json(combinedData);
        });
      });
    });
  });
};

// get parent student scheduled classes
exports.getParentStudentScheduledClasses = (req, res) => {
  let token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ error: "No token provided" });
  }

  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length); // Remove Bearer prefix
  }

  jwt.verify(token, "secret_key", (err, decoded) => {
    if (err) {
      return res.status(500).json({ error: "Failed to authenticate token" });
    }

    const userID = decoded.UserID;

    // get ParentID from parent table based on UserID
    const parentQuery = "SELECT ParentID FROM parent WHERE UserID = ?";
    db.query(parentQuery, [userID], (err, parentResults) => {
      if (err || parentResults.length === 0) {
        return res.status(500).json({ error: "Error fetching parent details" });
      }

      const parentID = parentResults[0].ParentID;

      // get StudentID from parentchildren table based on ParentID
      const studentQuery =
        "SELECT StudentID FROM parentchildren WHERE ParentID = ?";
      db.query(studentQuery, [parentID], (err, studentResults) => {
        if (err || studentResults.length === 0) {
          return res
            .status(500)
            .json({ error: "Error fetching student details" });
        }

        const studentID = studentResults[0].StudentID;

        // get UserID from student table based on StudentID
        const userQuery = "SELECT UserID FROM student WHERE StudentID = ?";
        db.query(userQuery, [studentID], (err, userResults) => {
          if (err || userResults.length === 0) {
            return res
              .status(500)
              .json({ error: "Error fetching user details" });
          }

          const userID = userResults[0].UserID;

          const getClassIDQuery =
            "SELECT ClassID FROM enrolledclasses WHERE UserID = ?";

          db.query(getClassIDQuery, [userID], (err, classResults) => {
            if (err) {
              console.error("Error fetching ClassID:", err);
              return res.status(500).json({ error: "Error fetching ClassID" });
            }

            if (classResults.length === 0) {
              return res
                .status(404)
                .json({ error: "No classes found for this user" });
            }

            const classIDs = classResults.map((result) => result.ClassID);

            // Query to get scheduled class details from classschedule using ClassID
            const getStudentScheduleQuery = `
          SELECT class.Subject, class.Grade, class.Tutor, classschedule.ScheduleID, classschedule.Repeat_On, classschedule.Hall_Num, classschedule.Start_Time, classschedule.End_Time
          FROM class
          INNER JOIN classschedule ON class.ClassID = classschedule.ClassID
          WHERE class.ClassID IN (?)
        `;

            db.query(getStudentScheduleQuery, [classIDs], (error, results) => {
              if (error) {
                console.error("Error fetching student schedule:", error);
                return res
                  .status(500)
                  .json({ error: "Error fetching student schedule" });
              }
              res.json(results);
            });
          });
        });
      });
    });
  });
};
