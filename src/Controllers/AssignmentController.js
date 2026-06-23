const { Class, AssignmentType, EnrolledClass, Student, Tutor } = require("../Models");
const jwt = require("jsonwebtoken");

// get all grades
exports.getGrades = async (req, res) => {
  try {
    const results = await Class.findAll({ attributes: [[Class.sequelize.fn('DISTINCT', Class.sequelize.col('Grade')), 'Grade']] });
    res.send(results);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
};

// Get all distinct subjects
exports.getSubjects = async (req, res) => {
  try {
    const results = await Class.findAll({ attributes: [[Class.sequelize.fn('DISTINCT', Class.sequelize.col('Subject')), 'Subject']] });
    res.send(results);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
};

// get all assignment types
exports.getAssignmentTypes = async (req, res) => {
  try {
    const results = await AssignmentType.findAll({ attributes: ['type_name'] });
    res.send(results);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
};

// Add new assignment type
exports.addAssignmentType = async (req, res) => {
  const { assignmentType } = req.body;

  if (!assignmentType) return res.status(400).send("Assignment type is required");

  try {
    const existing = await AssignmentType.findOne({ where: { type_name: assignmentType } });
    if (existing) return res.status(400).send("Assignment type already exists");

    await AssignmentType.create({ type_name: assignmentType });
    res.status(200).send("New assignment type added successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding new assignment type");
  }
};

// Get all students (for tutor to upload grades)
exports.getStudents = async (req, res) => {
  const { grade, subject, assignmentType } = req.body;

  if (!grade || !subject || !assignmentType) {
    return res.status(400).send("Grade, subject, and assignment type are required");
  }

  let token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: 'No token provided' });
  if (token.startsWith('Bearer ')) token = token.slice(7, token.length);

  jwt.verify(token, 'secret_key', async (err, decoded) => {
    if (err) return res.status(500).json({ error: 'Failed to authenticate token' });

    const userID = decoded.UserID;

    try {
      const tutor = await Tutor.findOne({ where: { UserID: userID } });
      if (!tutor) return res.status(404).send("Tutor not found for the given user");

      const cls = await Class.findOne({ where: { Grade: grade, Subject: subject, TutorID: tutor.TutorID } });
      if (!cls) return res.status(403).send("You can only upload grades related to your classes");

      const assignmentTypeRecord = await AssignmentType.findOne({ where: { type_name: assignmentType } });
      if (!assignmentTypeRecord) return res.status(404).send("No assignment type found for the given assignment type");

      const enrolledUsers = await EnrolledClass.findAll({ where: { ClassID: cls.ClassID } });
      if (enrolledUsers.length === 0) return res.status(404).send("No students enrolled in the class");

      const userIDs = enrolledUsers.map(row => row.UserID);

      const studentResults = await Student.findAll({
        where: { UserID: userIDs },
        attributes: ['StudentID', 'FirstName', 'LastName']
      });

      res.status(200).json({
        classID: cls.ClassID,
        assignmentTypeID: assignmentTypeRecord.assignment_type_id,
        students: studentResults
      });
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).send("Error fetching students");
    }
  });
};
