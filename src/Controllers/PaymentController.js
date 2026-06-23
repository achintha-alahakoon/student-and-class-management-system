const { Payment, Class, Student, Tutor, EnrolledClass } = require("../Models");
const moment = require('moment-timezone');
const jwt = require("jsonwebtoken");

//add payment
exports.addPayment = async (req, res) => {
  const { studentId, studentName, subject, tutor, grade, month, paymentType, amount } = req.body;

  try {
    const classObj = await Class.findOne({ where: { Subject: subject, Tutor: tutor, Grade: grade } });

    if (!classObj) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const studentObj = await Student.findOne({ where: { StudentID: studentId } });

    if (!studentObj) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    await Payment.create({
      PaymentDate: new Date(),
      PaymentTime: new Date(),
      Month: month,
      Amount: amount,
      Payment_Type: paymentType,
      StudentID: studentId,
      ClassID: classObj.ClassID
    });

    res.json({ success: true, message: "Payment added successfully" });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//get payment summary
exports.getPaymentSummary = async (req, res) => {
  const { studentId } = req.body;

  try {
    const payments = await Payment.findAll({
      where: { StudentID: 31 }, // from original code, hardcoded to 31
      include: [{ model: Class }]
    });

    if (payments.length === 0) {
      return res.status(404).json({ success: false, message: "Payment summary not found" });
    }

    res.json({ success: true, data: payments });
  } catch (error) {
    console.error("Error fetching payment summary:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//get admin payment summary
exports.getAdminPaymentSummary = async (req, res) => {
  const { studentId } = req.params;

  if (!studentId) {
    return res.status(400).json({ success: false, message: "Student ID is required" });
  }

  const currentMonth = moment().format("MMMM");

  try {
    const student = await Student.findOne({
      where: { StudentID: studentId },
      attributes: ['FirstName', 'LastName', 'Grade', 'UserID', 'StudentID']
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const enrolledClasses = await EnrolledClass.findAll({
      where: { UserID: student.UserID },
      include: [{ model: Class, attributes: ['ClassID', 'Subject', 'Grade', 'Tutor', 'Fees'] }]
    });

    const classResults = enrolledClasses.map(ec => ec.class.toJSON());

    if (classResults.length === 0) {
      return res.json({ success: true, student: student, classes: [] });
    }

    const classIds = classResults.map(cls => cls.ClassID);

    const payments = await Payment.findAll({
      where: { StudentID: studentId, ClassID: classIds, Month: currentMonth },
      attributes: ['ClassID', 'Status']
    });

    const paymentStatusMap = {};
    payments.forEach(payment => {
      paymentStatusMap[payment.ClassID] = payment.Status;
    });

    const classesWithStatus = classResults.map(cls => {
      return {
        ...cls,
        status: paymentStatusMap[cls.ClassID] || "Not Paid"
      };
    });

    res.json({ success: true, student: student, classes: classesWithStatus });
  } catch (error) {
    console.error("Error fetching admin payment summary:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// process payment
exports.processPayment = async (req, res) => {
  const { studentId, paymentDetails } = req.body;

  if (!studentId || !paymentDetails || paymentDetails.length === 0) {
    return res.status(400).json({ success: false, message: "Invalid data" });
  }

  const paymentDate = moment().tz('Asia/Colombo').format('YYYY-MM-DD');
  const paymentTime = moment().tz('Asia/Colombo').format('HH:mm:ss');
  const paymentType = "Cash";
  const status = "Paid";

  try {
    const paymentsToInsert = paymentDetails.map(detail => ({
      PaymentDate: paymentDate,
      PaymentTime: paymentTime,
      Month: detail.month,
      Amount: detail.fees,
      Payment_Type: paymentType,
      Status: status,
      StudentID: studentId,
      ClassID: detail.id
    }));

    await Payment.bulkCreate(paymentsToInsert);

    res.json({ success: true, message: "Payment processed successfully" });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// get tutor payment chart
exports.getTutorPaymentChart = async (req, res) => {
  let token = req.headers['authorization'];

  if (!token) return res.status(403).json({ error: 'No token provided' });
  if (token.startsWith('Bearer ')) token = token.slice(7, token.length);

  jwt.verify(token, 'secret_key', async (err, decoded) => {
    if (err) return res.status(500).json({ error: 'Failed to authenticate token' });

    const userID = decoded.UserID;

    try {
      const tutor = await Tutor.findOne({ where: { UserID: userID } });
      if (!tutor) return res.status(404).json({ error: "TutorID not found" });

      const classes = await Class.findAll({ where: { TutorID: tutor.TutorID } });
      const classIDs = classes.map(row => row.ClassID);

      const enrolledClasses = await EnrolledClass.findAll({ where: { ClassID: classIDs } });
      const totalStudentsCount = enrolledClasses.length;
      const userIDs = enrolledClasses.map(row => row.UserID);

      const students = await Student.findAll({ where: { UserID: userIDs } });
      const studentIDs = students.map(row => row.StudentID);

      const currentMonth = moment().tz('Asia/Colombo').format('MMMM');

      const payments = await Payment.findAll({
        where: { StudentID: studentIDs, Month: currentMonth }
      });

      const paymentData = {
        paid: 0,
        notPaid: totalStudentsCount
      };

      payments.forEach(payment => {
        if (payment.Status === 'Paid') {
          paymentData.paid += 1;
          paymentData.notPaid -= 1;
        }
      });

      return res.json(paymentData);
    } catch (error) {
      console.error("Error fetching tutor payment chart:", error);
      res.status(500).json({ error: "Error fetching tutor payment chart" });
    }
  });
};