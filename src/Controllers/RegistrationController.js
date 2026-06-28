const { User, Student, Parent, Tutor } = require("../Models");
const bcrypt = require("bcryptjs");
const db     = require("../Config/db");

//register student
exports.registerStudent = async (req, res) => {
  const {
    firstName,
    lastName,
    gender,
    grade,
    birthday,
    address,
    telephoneNumber,
    email,
    username,
    password,
  } = req.body;

  const transaction = await db.transaction();

  try {
    const user = await User.create(
      { username, password, userrole: 'Student' },
      { transaction }
    );

    const student = await Student.create(
      {
        FirstName: firstName,
        LastName: lastName,
        Gender: gender,
        Grade: grade,
        Birthday: birthday,
        Address: address,
        TelNo: telephoneNumber,
        Email: email,
        UserID: user.UserID,
      },
      { transaction }
    );

    await transaction.commit();

    const fullName = `${firstName} ${lastName}`;
    res.status(200).send({
      message: "Registration successful",
      StudentID: student.StudentID,
      Name: fullName,
      Address: address,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("Error inserting student data:", err);
    res.status(500).send("Error inserting student data");
  }
};

//register parent
exports.registerParent = async (req, res) => {
  const {
    firstName,
    lastName,
    telephoneNumber,
    email,
    nicNumber,
    studentNumber,
    gender,
    address,
    username,
    password,
  } = req.body;

  try {
    // Check if the student number exists
    const studentExists = await Student.findOne({ where: { StudentID: studentNumber } });

    if (!studentExists) {
      return res.status(400).send({ message: "This student does not exist" });
    }

    const transaction = await db.transaction();

    try {
      const user = await User.create(
        { username, password, userrole: 'Parent' },
        { transaction }
      );

      await Parent.create(
        {
          FirstName: firstName,
          LastName: lastName,
          TelNo: telephoneNumber,
          Email: email,
          NICNo: nicNumber,
          StudentNo: studentNumber,
          Gender: gender,
          Address: address,
          UserID: user.UserID,
        },
        { transaction }
      );

      await transaction.commit();
      res.status(200).send({ message: "Registration successful" });
    } catch (err) {
      await transaction.rollback();
      console.error("Error inserting parent data:", err);
      res.status(500).send({ message: "Error inserting parent data" });
    }
  } catch (err) {
    console.error("Error checking student number:", err);
    res.status(500).send({ message: "Error checking student number" });
  }
};

//register tutor
exports.registerTutor = async (req, res) => {
  const {
    FirstName,
    LastName,
    NICNo,
    Gender,
    DOB,
    TelNo,
    Email,
    Subject,
    Address,
    Username,
    Password,
  } = req.body;
 
  // From auth middleware — matches decoded JWT keys
  const TenantID = req.user?.tenantId;
 
  console.log("req.user:", req.user);
  console.log("TenantID:", TenantID);
  console.log("req.body:", req.body);
 
  if (!TenantID) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized: tenant not identified",
    });
  }
 
  // Validate required fields
  const missing = [];
  if (!FirstName) missing.push("FirstName");
  if (!LastName)  missing.push("LastName");
  if (!NICNo)     missing.push("NICNo");
  if (!Gender)    missing.push("Gender");
  if (!TelNo)     missing.push("TelNo");
  if (!Subject)   missing.push("Subject");
  if (!Username)  missing.push("Username");
  if (!Password)  missing.push("Password");
 
  if (missing.length) {
    return res.status(400).json({
      status: "error",
      message: `Missing required fields: ${missing.join(", ")}`,
    });
  }
 
  if (Password.length < 6) {
    return res.status(400).json({
      status: "error",
      message: "Password must be at least 6 characters",
    });
  }
 
  const transaction = await db.transaction();
 
  try {
    // Check username unique within tenant
    const existingUser = await User.findOne({
      where: { username: Username, TenantID },
      transaction,
    });
    if (existingUser) {
      await transaction.rollback();
      return res.status(409).json({
        status: "error",
        message: "Username already exists for this organisation",
      });
    }
 
    // Check NIC unique within tenant
    const existingTutor = await Tutor.findOne({
      where: { NICNo, TenantID },
      transaction,
    });
    if (existingTutor) {
      await transaction.rollback();
      return res.status(409).json({
        status: "error",
        message: "A tutor with this NIC number already exists",
      });
    }
 
    // Hash password
    const hashedPassword = await bcrypt.hash(Password, 10);
 
    // Step 1: Create user row
    const user = await User.create(
      {
        username: Username,
        password: hashedPassword,
        userrole: "Tutor",
        TenantID,
      },
      { transaction }
    );
 
    console.log("User created with ID:", user.UserID);
 
    // Step 2: Create tutor row linked to user
    const tutor = await Tutor.create(
      {
        FirstName,
        LastName,
        NICNo,
        Gender,
        Birthday: DOB     || null,
        TelNo,
        Email:    Email   || null,
        Subject,
        Address:  Address || null,
        UserID:   user.UserID,
        TenantID,
      },
      { transaction }
    );
 
    console.log("Tutor created with ID:", tutor.TutorID);
 
    await transaction.commit();
 
    return res.status(201).json({
      status:  "success",
      message: "Tutor registered successfully",
      data: {
        tutorId:  tutor.TutorID,
        userId:   user.UserID,
        name:     `${FirstName} ${LastName}`,
        username: Username,
        subject:  Subject,
      },
    });
 
  } catch (err) {
    await transaction.rollback();
    console.error("Error registering tutor:", err);
    return res.status(500).json({
      status:  "error",
      message: "Internal server error. Please try again.",
    });
  }
};
