const db = require("../Config/db");


//register student

exports.registerStudent = (req, res) => {
  const {
    firstName,
    lastName,
    gender,
    grade,
    birthday,
    address,
    telephoneNumber,
    email,
    username,
    password,
  } = req.body;

  const userQuery = "INSERT INTO user (username, password, userrole) VALUES (?, ?, 'Student');";
  const studentQuery = "INSERT INTO student (FirstName, LastName, Gender, Grade, Birthday, Address, TelNo, Email, UserID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);";

  db.query(userQuery, [username, password], (err, results) => {
    if (err) {
      console.error("Error inserting user:", err);
      res.status(500).send("Error inserting user data");
      return;
    }

    db.query("SELECT LAST_INSERT_ID() AS UserID;", (err, result) => {
      if (err) {
        console.error("Error retrieving UserID:", err);
        res.status(500).send("Error retrieving UserID");
        return;
      }
      const userID = result[0].UserID;

      db.query(
        studentQuery,
        [firstName, lastName, gender, grade, birthday, address, telephoneNumber, email, userID],
        (err, result) => {
          if (err) {
            console.error("Error inserting student data:", err);
            res.status(500).send("Error inserting student data");
            return;
          }

          db.query("SELECT LAST_INSERT_ID() AS StudentID;", (err, result) => {
            if (err) {
              console.error("Error retrieving StudentID:", err);
              res.status(500).send("Error retrieving StudentID");
              return;
            }

            const studentID = result[0].StudentID;
            const fullName = `${firstName} ${lastName}`;
            res.status(200).send({ message: "Registration successful", StudentID: studentID, Name: fullName, Address: address });
          });
        }
      );
    });
  });
};



//register parent
exports.registerParent = (req, res) => {
  const {
    firstName,
    lastName,
    telephoneNumber,
    email,
    nicNumber,
    studentNumber,
    gender,
    address,
    username,
    password,
  } = req.body;

  const parentQuery =
    "INSERT INTO parent (FirstName, LastName, TelNo, Email, NICNo, StudentNo, Gender, Address, UserID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const userQuery =
    "INSERT INTO user (username, password, userrole) VALUES (?, ?, 'Parent')";
  const checkStudentQuery =
    "SELECT COUNT(*) AS count FROM student WHERE StudentID = ?";

  // Check if the student number exists
  db.query(checkStudentQuery, [studentNumber], (err, result) => {
    if (err) {
      console.error("Error checking student number:", err);
      res.status(500).send({ message: "Error checking student number" });
      return;
    }

    if (result[0].count === 0) {
      res.status(400).send({ message: "This student does not exist" });
      return;
    }

    // Insert user data
    db.query(userQuery, [username, password], (err, result) => {
      if (err) {
        console.error("Error inserting user:", err);
        res.status(500).send({ message: "Error inserting user data" });
        return;
      }

      // Get the last inserted UserID
      db.query("SELECT LAST_INSERT_ID() AS UserID;", (err, result) => {
        if (err) {
          console.error("Error getting last insert ID:", err);
          res.status(500).send({ message: "Error getting last insert ID" });
          return;
        }
        const userID = result[0].UserID;

        // Insert parent data
        db.query(
          parentQuery,
          [
            firstName,
            lastName,
            telephoneNumber,
            email,
            nicNumber,
            studentNumber,
            gender,
            address,
            userID,
          ],
          (err, result) => {
            if (err) {
              console.error("Error inserting parent data:", err);
              res.status(500).send({ message: "Error inserting parent data" });
              return;
            }
            res.status(200).send({ message: "Registration successful" });
          }
        );
      });
    });
  });
};



//register tutor
exports.registerTutor = (req, res) => {
  const {
    firstName,
    lastName,
    telephoneNumber,
    email,
    nicNumber,
    subject,
    gender,
    address,
    username,
    password,
  } = req.body;

  const tutorQuery =
    "INSERT INTO tutor (FirstName, LastName, Gender, Address, TelNo, Email, NICNo, Subject, UserID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const userQuery =
    "INSERT INTO user (username, password, userrole) VALUES (?, ?, 'Tutor')";

  db.query(userQuery, [username, password], (err, result) => {
    if (err) {
      console.error(
        "Error ***********************",
        err
      );
      console.error("Error inserting user:", err);
      return;
    }

    db.query("SELECT LAST_INSERT_ID() AS UserID;", (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error inserting user data");
        return;
      }
      const userID = result[0].UserID;

      db.query(
        tutorQuery,
        [
          firstName,
          lastName,
          gender,
          address,
          telephoneNumber,
          email,
          nicNumber,
          subject,
          userID,
        ],
        (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).send("Error inserting tutor data");
            return;
          }
          res.status(200).send("Registration successful");
        }
      );
    });
  });
};
