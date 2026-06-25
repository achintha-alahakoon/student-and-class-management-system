const jwt = require("jsonwebtoken");
const {
  User,
  Student,
  Parent,
  Tutor,
  EnrolledClass,
  Class,
} = require("../Models");

// Middleware to verify JWT token
exports.verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Authorization header missing",
    });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.UserID = decoded.UserID;
    req.TenantID = decoded.TenantID;
    req.Role = decoded.Role;

    next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
};

// Route for user login
exports.login = async (req, res) => {
  const { username, password, TenantID } = req.body;

  try {
    const user = await User.findOne({
      where: { username, TenantID }, // Filter by both
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    // Replace this later with bcrypt.compare()
    if (user.password !== password) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    const token = jwt.sign(
      {
        UserID: user.UserID,
        TenantID: user.TenantID,
        Role: user.userrole,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
      },
    );

    res.json({
      status: "success",
      token,
      user: {
        UserID: user.UserID,
        TenantID: user.TenantID,
        Name: user.name,
        Role: user.userrole,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Internal Server Error",
    });
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
