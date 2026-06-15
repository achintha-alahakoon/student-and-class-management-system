const db = require("../Config/db");
const jwt = require("jsonwebtoken");

// Middleware to verify JWT token
exports.verifyJWT = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(403).json({ error: "Token not provided" });

  jwt.verify(token, "secret_key", (err, decoded) => {
    if (err) return res.status(401).json({ error: "Unauthorized" });
    req.UserID = decoded.UserID;
    next();
  });
};

// Route for user login
exports.login = (req, res) => {
  const { username, password } = req.body;

  const sql = "SELECT * FROM user WHERE username = ? AND password = ?";

  db.query(sql, [username, password], (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (data.length > 0) {
      const user = data[0];
      const token = jwt.sign({ UserID: user.UserID, role: user.userrole }, "secret_key", {
        expiresIn: "2h",
      });
      const { userrole } = user; // Extract userrole from the user object
      res.status(200).json({ status: "success", role: userrole, token });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });
};



// Route for getting user details

exports.getUser = (req, res) => {
  const userId = req.params.userId;

  const userSql = "SELECT * FROM user WHERE UserID = ?";
  db.query(userSql, [userId], (err, userData) => {
    if (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
    if (userData.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userData[0];
    const userrole = user.userrole;

    let detailSql = "";
    let detailParams = [userId];

    switch (userrole) {
      case "Student":
        detailSql = "SELECT * FROM student WHERE UserID = ?";
        break;
      case "Tutor":
        detailSql = "SELECT * FROM tutor WHERE UserID = ?";
        break;
      case "Parent":
        detailSql = "SELECT * FROM parent WHERE UserID = ?";
        break;

      default:
        return res.status(400).json({ error: "Invalid user type" });
    }

    db.query(detailSql, detailParams, (err, detailData) => {
      if (err) {
        return res.status(500).json({ error: "Internal Server Error" });
      }

      if (detailData.length === 0) {
        return res.status(404).json({ error: `${userrole} details not found` });
      }

      const userDetails = {
        ...user,
        ...detailData[0],
      };

      if (userrole === "Student") {
        const enrolledClassesSql = `
          SELECT ec.ClassID, c.Subject, c.Tutor
          FROM enrolledclasses ec
          JOIN class c ON ec.ClassID = c.ClassID
          WHERE ec.UserID = ?`;
        db.query(enrolledClassesSql, [userId], (err, classData) => {
          if (err) {
            return res.status(500).json({ error: "Internal Server Error" });
          }

          userDetails.classes = classData;

          res.status(200).json({ status: "success", user: userDetails });
        });
      } else if (userrole === "Tutor") {
        const tutorIdSql = "SELECT TutorID FROM tutor WHERE UserID = ?";
        db.query(tutorIdSql, [userId], (err, tutorData) => {
          if (err) {
            return res.status(500).json({ error: "Internal Server Error" });
          }

          if (tutorData.length === 0) {
            return res.status(404).json({ error: "Tutor details not found" });
          }

          const tutorId = tutorData[0].TutorID;
          const tutorClassesSql = `
            SELECT Subject, Grade
            FROM class
            WHERE TutorID = ?`;
          db.query(tutorClassesSql, [tutorId], (err, classData) => {
            if (err) {
              return res.status(500).json({ error: "Internal Server Error" });
            }

            userDetails.classes = classData;

            res.status(200).json({ status: "success", user: userDetails });
          });
        });
      } 
      // else if (userrole === "Parent") {
      //   const parentClassesSql = `
      //     SELECT c.Subject, c.Grade
      //     FROM class c
      //     JOIN tutor t ON c.TutorID = t.UserID
      //     WHERE t.UserID = ?`;
      //   db.query(parentClassesSql, [userId], (err, classData) => {
      //     if (err) {
      //       return res.status(500).json({ error: "Internal Server Error" });
      //     }

      //     userDetails.classes = classData;

      //     res.status(200).json({ status: "success", user: userDetails });
      //   });
      // }
       else {
        res.status(200).json({ status: "success", user: userDetails });
      }
    });
  });
};

