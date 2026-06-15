const db = require("../Config/db");

exports.getAllParents = (req, res) => {
    const query = "SELECT FirstName, LastName, Gender, StudentNo, ParentID, UserID FROM parent";
    db.query(query, (error, results) => {
      if (error) {
        console.error("Error fetching parents:", error);
        res.status(500).json({ error: "Error fetching parents" });
        return;
      }
      res.json(results);
    });
  };


//delete parent data
exports.deleteParent = (req, res) => {
    const userId = req.params.userId;
    
    const parentQuery = "DELETE FROM parent WHERE UserID = ?";
    const userQuery = "DELETE FROM user WHERE UserID = ?";
    db.query(parentQuery, [userId], (error, parentResult) => {
        if (error) {
            console.error("Error deleting parent:", error);
            return res.status(500).json({ error: "Error deleting parent", error });
        }
        db.query(userQuery, [userId], (error, userResult) => {
            if (error) {
                console.error("Error deleting user:", error);
                return res.status(500).json({ error: "Error deleting user" });
            }
            res.json({ message: "Parent and user data deleted successfully." });
        });
    });
};