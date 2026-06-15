const db = require("../Config/db");

exports.getAllSubjects = (req, res) => {
  const query = "SELECT Subject FROM tutor";
  db.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ error: "Error fetching subjects" });
      return;
    }
    res.json(results);
  });
};



// get subject averages
exports.getSubjectAverages = (req, res) => {
  const query = `
    SELECT c.Subject, ROUND(AVG(g.Grade), 2) as average_score
    FROM class c
    JOIN assignments a ON c.ClassID = a.ClassID
    JOIN grades g ON a.AssignmentsID = g.AssignmentsID
    GROUP BY c.Subject
  `;
  db.query(query, (error, results) => {
    if (error) {
      res.status(500).send(error);
    } else {
      res.json(results);
    }
  });
};
