const { db, User, Student, Parent, Tutor } = require("../Models");

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
    firstName,
    lastName,
    telephoneNumber,
    email,
    nicNumber,
    subject,
    gender,
    address,
    username,
    password,
  } = req.body;

  const transaction = await db.transaction();

  try {
    const user = await User.create(
      { username, password, userrole: 'Tutor' },
      { transaction }
    );

    await Tutor.create(
      {
        FirstName: firstName,
        LastName: lastName,
        Gender: gender,
        Address: address,
        TelNo: telephoneNumber,
        Email: email,
        NICNo: nicNumber,
        Subject: subject,
        UserID: user.UserID,
      },
      { transaction }
    );

    await transaction.commit();
    res.status(200).send("Registration successful");
  } catch (err) {
    await transaction.rollback();
    console.error("Error inserting tutor data:", err);
    res.status(500).send("Error inserting tutor data");
  }
};
