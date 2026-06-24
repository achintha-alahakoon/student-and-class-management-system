const { Tutor, Class, EnrolledClass } = require("../Models");
const jwt = require('jsonwebtoken');

// get tutor classes
exports.getTutorClasses = async (req, res) => {
  let token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ error: 'No token provided' });
  }

  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length); // Remove Bearer prefix
  }

  jwt.verify(token, 'secret_key', async (err, decoded) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to authenticate token' });
    }

    const userID = decoded.UserID;

    try {
      const tutor = await Tutor.findOne({ where: { UserID: userID } });

      if (!tutor) {
        return res.status(404).json({ error: 'Tutor not found' });
      }

      const tutorID = tutor.TutorID;

      const classes = await Class.findAll({
        where: { TutorID: tutorID },
        attributes: ['Subject', 'Grade']
      });

      res.json(classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ error: 'Error fetching classes' });
    }
  });
};

//get student classes
exports.getStudentClasses = async (req, res) => {
  let token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ error: 'No token provided' });
  }

  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length); // Remove Bearer prefix
  }

  jwt.verify(token, 'secret_key', async (err, decoded) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to authenticate token' });
    }

    const userID = decoded.UserID;

    try {
      const enrolledClasses = await EnrolledClass.findAll({
        where: { UserID: userID },
        attributes: ['ClassID']
      });

      if (enrolledClasses.length === 0) {
        return res.status(404).json({ error: 'No classes found for this user' });
      }

      const classIDs = enrolledClasses.map(ec => ec.ClassID);

      const classes = await Class.findAll({
        where: { ClassID: classIDs },
        attributes: ['ClassID', 'Subject', 'Grade', 'TutorID']
      });

      res.json(classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ error: 'Error fetching classes' });
    }
  });
};