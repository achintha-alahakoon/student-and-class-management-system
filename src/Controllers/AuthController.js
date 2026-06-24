const jwt = require("jsonwebtoken");
const { User, Student, Parent, Tutor, EnrolledClass, Class } = require("../Models");

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
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { username, password } });

    if (user) {
      const token = jwt.sign({ UserID: user.UserID, role: user.userrole }, "secret_key", {
        expiresIn: "2h",
      });
      res.status(200).json({ status: "success", role: user.userrole, token });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Route for getting user details
exports.getUser = async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userrole = user.userrole;
    let userDetails = user.toJSON();

    if (userrole === "Student") {
      const student = await Student.findOne({ where: { UserID: userId } });
      if (!student) return res.status(404).json({ error: "Student details not found" });
      userDetails = { ...userDetails, ...student.toJSON() };

      const enrolledClasses = await EnrolledClass.findAll({
        where: { UserID: userId },
        include: [{ model: Class, attributes: ['Subject', 'Tutor'] }],
      });
      userDetails.classes = enrolledClasses.map(ec => ({
        ClassID: ec.ClassID,
        Subject: ec.class.Subject,
        Tutor: ec.class.Tutor,
      }));
    } else if (userrole === "Tutor") {
      const tutor = await Tutor.findOne({ where: { UserID: userId } });
      if (!tutor) return res.status(404).json({ error: "Tutor details not found" });
      userDetails = { ...userDetails, ...tutor.toJSON() };

      const classes = await Class.findAll({
        where: { TutorID: tutor.TutorID },
        attributes: ['Subject', 'Grade']
      });
      userDetails.classes = classes.map(c => c.toJSON());
    } else if (userrole === "Parent") {
      const parent = await Parent.findOne({ where: { UserID: userId } });
      if (!parent) return res.status(404).json({ error: "Parent details not found" });
      userDetails = { ...userDetails, ...parent.toJSON() };
    } else {
      return res.status(400).json({ error: "Invalid user type" });
    }

    res.status(200).json({ status: "success", user: userDetails });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
