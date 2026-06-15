const db = require("../Config/db");

// Get count of students, tutors, parents, and unique subjects
exports.getCounts = (req, res) => {
    const queries = [
        "SELECT COUNT(*) as studentCount FROM student",
        "SELECT COUNT(*) as tutorCount FROM tutor",
        "SELECT COUNT(*) as parentCount FROM parent",
        "SELECT COUNT(DISTINCT Subject) as subjectCount FROM tutor"
    ];

    const counts = {};

    const executeQuery = (query) => {
        return new Promise((resolve, reject) => {
            db.query(query, (error, results) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(results[0]);
            });
        });
    };

    Promise.all(queries.map(query => executeQuery(query)))
        .then(results => {
            results.forEach((result, index) => {
                const key = Object.keys(result)[0];
                counts[key] = result[key];
            });
            res.json(counts);
        })
        .catch(error => {
            console.error("Error fetching counts:", error);
            res.status(500).json({ error: "Error fetching counts" });
        });
};


// get All
exports.getAll = (req, res) => {
    
    db.query('SELECT DISTINCT Tutor FROM class', (err, tutorResults) => {
      if (err) {
        console.error('Error fetching tutors:', err);
        res.status(500).json({ error: 'Error fetching tutors' });
        return;
      }
  
      db.query('SELECT DISTINCT Grade FROM class', (err, gradeResults) => {
        if (err) {
          console.error('Error fetching grades:', err);
          res.status(500).json({ error: 'Error fetching grades' });
          return;
        }
  
        db.query('SELECT DISTINCT Subject FROM class', (err, subjectResults) => {
          if (err) {
            console.error('Error fetching subjects:', err);
            res.status(500).json({ error: 'Error fetching subjects' });
            return;
          }
  
          const data = {
            tutors: tutorResults.map(row => row.Tutor),
            grades: gradeResults.map(row => row.Grade),
            subjects: subjectResults.map(row => row.Subject)
          };
          res.json(data);
        });
      });
    });
  };