const { Student, Class, EnrolledClass, Tutor, Parent, ParentChild } = require("../Models");
const jwt = require("jsonwebtoken");

// assign student to class
exports.assignStudent = async (req, res) => {
  const { studentID, grade, subject, tutor } = req.body;

  try {
    const student = await Student.findOne({ where: { StudentID: studentID } });
    if (!student) return res.status(404).json({ error: 'User not found' });

    const cls = await Class.findOne({ where: { Grade: grade, Subject: subject, Tutor: tutor } });
    if (!cls) return res.status(404).json({ error: 'Class not found' });

    await EnrolledClass.create({
      UserID: student.UserID,
      ClassID: cls.ClassID,
      TutorID: cls.TutorID
    });

    return res.json({ message: 'Student assigned to class successfully' });
  } catch (err) {
    console.error('Error assigning student to class:', err);
    return res.status(500).json({ error: 'Error assigning student to class' });
  }
};

// assign tutor to class
exports.assignTutor = async (req, res) => {
  const { tutorID, grade, subject, fees } = req.body;

  try {
    const tutor = await Tutor.findOne({ where: { TutorID: tutorID } });
    if (!tutor) return res.status(404).json({ error: 'Tutor not found' });

    const tutorName = `${tutor.FirstName} ${tutor.LastName}`;

    await Class.create({ Subject: subject, Grade: grade, TutorID: tutorID, Tutor: tutorName, Fees: fees });

    return res.json({ message: `Tutor ${tutorName} added to class successfully` });
  } catch (err) {
    console.error('Error adding tutor to class:', err);
    return res.status(500).json({ error: 'Error adding tutor to class' });
  }
};

// get student details (for parent)
exports.getStudents = async (req, res) => {
  let token = req.headers['authorization'];

  if (!token) return res.status(403).json({ error: 'No token provided' });
  if (token.startsWith('Bearer ')) token = token.slice(7, token.length);

  jwt.verify(token, 'secret_key', async (err, decoded) => {
    if (err) return res.status(500).json({ error: 'Failed to authenticate token' });

    const userID = decoded.UserID;

    try {
      const parent = await Parent.findOne({ where: { UserID: userID } });
      if (!parent) return res.status(404).json({ error: 'ParentID not found' });

      const children = await ParentChild.findAll({ where: { ParentID: parent.ParentID } });
      res.json(children);
    } catch (error) {
      console.error("Error fetching student details:", error);
      res.status(500).json({ error: 'Error fetching student details' });
    }
  });
};