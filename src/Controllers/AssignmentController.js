const db = require("../Config/db");
const jwt = require("jsonwebtoken");

// get all grades

exports.getGrades = (req, res) => {
    db.query("SELECT DISTINCT Grade FROM class", (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send(err);
        } else {
            res.send(result);
        }
    });
}

// Get all distinct subjects
exports.getSubjects = (req, res) => {
    db.query("SELECT DISTINCT Subject FROM class", (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send(err);
        } else {
            res.send(result);
        }
    });
}


// get all assignment types
exports.getAssignmentTypes = (req, res) => {
    db.query("SELECT type_name FROM assignment_type", (err, result) => {
        if (err) {
            console.log(err);
        } else {
            res.send(result);
        }
    });
}


// Add new assignment type
exports.addAssignmentType = (req, res) => {
    const { assignmentType } = req.body;

    if (!assignmentType) {
        return res.status(400).send("Assignment type is required");
    }

    // Check if the assignment type already exists
    db.query("SELECT * FROM assignment_type WHERE type_name = ?", [assignmentType], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error checking assignment type");
        }

        if (results.length > 0) {
            return res.status(400).send("Assignment type already exists");
        }

        // Insert new assignment type into the database
        db.query("INSERT INTO assignment_type (type_name) VALUES (?)", [assignmentType], (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).send("Error adding new assignment type");
            } else {
                res.status(200).send("New assignment type added successfully");
            }
        });
    });
}


// Get all students

exports.getStudents = (req, res) => {
    const { grade, subject, assignmentType } = req.body;


    if (!grade || !subject || !assignmentType) {
        return res.status(400).send("Grade, subject, and assignment type are required");
    }

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

        // Query to get TutorID from tutor table
        const getTutorIDQuery = 'SELECT TutorID FROM tutor WHERE UserID = ?';
        db.query(getTutorIDQuery, [userID], (err, tutorResults) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Error fetching tutor ID");
            }

            if (tutorResults.length === 0) {
                return res.status(404).send("Tutor not found for the given user");
            }

            const tutorID = tutorResults[0].TutorID;

            // Query to check if the tutor is associated with the given grade and subject
            const checkTutorClassQuery = 'SELECT ClassID FROM class WHERE Grade = ? AND Subject = ? AND TutorID = ?';
            db.query(checkTutorClassQuery, [grade, subject, tutorID], (err, classResults) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Error checking tutor class association");
                }

                if (classResults.length === 0) {
                    return res.status(403).send("You can only upload grades related to your classes");
                }
                const classID = classResults[0].ClassID;

                // Continue with the existing process

                // First query: Get assignment type ID
                const getAssignmentTypeIDQuery = "SELECT assignment_type_id FROM assignment_type WHERE type_name = ?";
                db.query(getAssignmentTypeIDQuery, [assignmentType], (err, assignmentResults) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send("Error fetching assignment type ID");
                    }

                    if (assignmentResults.length === 0) {
                        return res.status(404).send("No assignment type found for the given assignment type");
                    }

                    const assignmentTypeID = assignmentResults[0].assignment_type_id;

                    // Third query: Get UserID from enrolledclasses table
                    const getUserIDQuery = "SELECT UserID FROM enrolledclasses WHERE ClassID = ?";
                    db.query(getUserIDQuery, [classID], (err, enrolledResults) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send("Error fetching enrolled users");
                        }

                        if (enrolledResults.length === 0) {
                            return res.status(404).send("No students enrolled in the class");
                        }

                        const userIDs = enrolledResults.map(row => row.UserID);

                        // Fourth query: Get student details from student table
                        const getStudentDetailsQuery = "SELECT StudentID, FirstName, LastName FROM student WHERE UserID IN (?)";
                        db.query(getStudentDetailsQuery, [userIDs], (err, studentResults) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).send("Error fetching student details");
                            }

                            res.status(200).json({
                                classID,
                                assignmentTypeID,
                                students: studentResults
                            });
                        });
                    });
                });
            });
        });
    });
};


