const { Student, Parent, ParentChild } = require("../Models");
const jwt = require("jsonwebtoken");

// get student name
exports.getStudentName = async (req, res) => {
  let token = req.headers['authorization'];

  if (!token) return res.status(403).json({ error: 'No token provided' });
  if (token.startsWith('Bearer ')) token = token.slice(7, token.length);

  jwt.verify(token, 'secret_key', async (err, decoded) => {
    if (err) {
      console.error("Failed to authenticate token:", err);
      return res.status(500).json({ error: 'Failed to authenticate token' });
    }

    const userID = decoded.UserID;

    try {
      const student = await Student.findOne({ where: { UserID: userID }, attributes: ['FirstName', 'LastName'] });
      if (!student) return res.status(404).json({ error: 'Student not found' });
      res.json({ firstName: student.FirstName, lastName: student.LastName });
    } catch (err) {
      console.error("Error fetching student's name:", err);
      res.status(500).json({ error: "Error fetching student's name" });
    }
  });
};

// get parent name
exports.getParentName = async (req, res) => {
  let token = req.headers['authorization'];

  if (!token) return res.status(403).json({ error: 'No token provided' });
  if (token.startsWith('Bearer ')) token = token.slice(7, token.length);

  jwt.verify(token, 'secret_key', async (err, decoded) => {
    if (err) {
      console.error("Failed to authenticate token:", err);
      return res.status(500).json({ error: 'Failed to authenticate token' });
    }

    const userID = decoded.UserID;

    try {
      const parent = await Parent.findOne({ where: { UserID: userID }, attributes: ['FirstName', 'LastName'] });
      if (!parent) return res.status(404).json({ error: 'Parent not found' });
      res.json({ firstName: parent.FirstName, lastName: parent.LastName });
    } catch (err) {
      console.error("Error fetching parent's name:", err);
      res.status(500).json({ error: "Error fetching parent's name" });
    }
  });
};

exports.getParentsStudent = async (req, res) => {
  const { ParentID, StudentID } = req.params;
  let token = req.headers['authorization'];

  if (!token) return res.status(403).json({ error: 'No token provided' });
  if (token.startsWith('Bearer ')) token = token.slice(7, token.length);

  jwt.verify(token, 'secret_key', async (err, decoded) => {
    if (err) {
      console.error("Failed to authenticate token:", err);
      return res.status(500).json({ error: 'Failed to authenticate token' });
    }

    const userID = decoded.UserID;

    try {
      const parent = await Parent.findOne({ where: { UserID: userID }, attributes: ['ParentID'] });
      if (!parent) return res.status(404).json({ error: 'Parent not found' });

      const parentIDFromToken = parent.ParentID;
      if (String(parentIDFromToken).trim() !== String(ParentID).trim()) {
        return res.status(403).json({ error: 'ParentID does not match. You cannot add this student.' });
      }

      const student = await Student.findOne({
        where: { StudentID: StudentID },
        attributes: ['FirstName', 'LastName', 'Grade']
      });
      if (!student) return res.status(404).json({ error: 'Student not found' });

      const { FirstName, LastName, Grade } = student;

      await ParentChild.create({ ParentID, StudentID, FirstName, LastName, Grade });

      const parentChildren = await ParentChild.findAll({
        where: { ParentID: parentIDFromToken, StudentID: StudentID }
      });

      res.json({ parentChildren });
    } catch (err) {
      console.error("Error in getParentsStudent:", err);
      res.status(500).json({ error: 'You have already added that Student..!' });
    }
  });
};


