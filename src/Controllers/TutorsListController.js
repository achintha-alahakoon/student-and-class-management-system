const db = require("../Config/db");

exports.getAllTutors = (req, res) => {
    const query = "SELECT FirstName, LastName, Gender, Subject, TutorID, UserID FROM tutor";
    db.query(query, (error, results) => {
      if (error) {
        console.error("Error fetching tutors:", error);
        res.status(500).json({ error: "Error fetching tutors" });
        return;
      }
      res.json(results);
    });
  };


//delete tutor data
exports.deleteTutor = (req, res) => {
    const userId = req.params.userId;
    
    const tutorQuery = "DELETE FROM tutor WHERE UserID = ?";
    const userQuery = "DELETE FROM user WHERE UserID = ?";
    db.query(tutorQuery, [userId], (error, tutorResult) => {
        if (error) {
            console.error("Error deleting tutor:", error);
            return res.status(500).json({ error: "Error deleting tutor", error });
        }
        db.query(userQuery, [userId], (error, userResult) => {
            if (error) {
                console.error("Error deleting user:", error);
                return res.status(500).json({ error: "Error deleting user" });
            }
            res.json({ message: "Tutor and user data deleted successfully." });
        });
    });
};