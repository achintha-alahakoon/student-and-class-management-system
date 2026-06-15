const db = require("../Config/db");
const moment = require('moment-timezone');
const jwt = require("jsonwebtoken");

//add payment
exports.addPayment = (req, res) => {
    const {
        studentId,
        studentName,
        subject,
        tutor,
        grade,
        month,
        paymentType,
        amount,
    } = req.body;

    // Query to get ClassID from the class table based on subject, tutor, and grade
    const classQuery = "SELECT ClassID FROM class WHERE Subject = ? AND Tutor = ? AND Grade = ?";
    db.query(classQuery, [subject, tutor, grade], (classErr, classResult) => {
        if (classErr) {
            console.error("Error fetching class data:", classErr);
            return res.status(500).json({ success: false, message: "Server error1" });
        }
        
        if (classResult.length === 0) {
            return res.status(404).json({ success: false, message: "Class not found" });
        }

        const classId = classResult[0].ClassID;

        // Query to check if the student exists in the student table
        const studentQuery = "SELECT * FROM student WHERE StudentID = ?";
        db.query(studentQuery, [studentId], (studentErr, studentResult) => {
            if (studentErr) {
                console.error("Error fetching student data:", studentErr);
                return res.status(500).json({ success: false, message: "Server error2" });
            }

            if (studentResult.length === 0) {
                return res.status(404).json({ success: false, message: "Student not found" });
            }

            // Insert payment details into the payment table
            const paymentQuery = "INSERT INTO payment (PaymentDate, PaymentTime,Month, Amount, Payment_Type, StudentID, ClassID) VALUES (CURDATE(), CURTIME(), ?, ?, ?, ?, ?)";
            db.query(paymentQuery, [month, amount, paymentType, studentId, classId], (paymentErr, paymentResult) => {
                if (paymentErr) {
                    console.error("Error inserting payment data:", paymentErr);
                    return res.status(500).json({ success: false, message: "Server error3" });
                }

                res.json({ success: true, message: "Payment added successfully" });
            });
        });
    });
};

//get payment summary
exports.getPaymentSummary = (req, res) => {
    const { studentId } = req.body;
    const query = "SELECT * FROM payment, class WHERE StudentID = 31 AND payment.ClassID = class.ClassID";
    db.query(query, [studentId], (error, results) => {
        if (error) {
            console.error("Error fetching payment summary:", error);
            return res.status(500).json({ success: false, message: "Server error" });
        }
        console.log("Payment summary:", results); // log results to console
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "Payment summary not found" });
        }

        res.json({ success: true, data: results });
    });
}

//get admin payment summary

exports.getAdminPaymentSummary = (req, res) => {
    const { studentId } = req.params;

    // Validate the input
    if (!studentId) {
        return res.status(400).json({ success: false, message: "Student ID is required" });
    }

    const currentMonth = moment().format("MMMM");

    const studentQuery = "SELECT FirstName, LastName, Grade, UserID, StudentID FROM student WHERE StudentID = ?";

    db.query(studentQuery, [studentId], (error, studentResults) => {
        if (error) {
            console.error("Error fetching student details:", error);
            return res.status(500).json({ success: false, message: "Server error" });
        }

        if (studentResults.length === 0) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        const userID = studentResults[0].UserID;

        const classQuery = `
            SELECT c.ClassID, c.Subject, c.Grade, c.Tutor, c.Fees
            FROM enrolledclasses ec
            JOIN class c ON ec.ClassID = c.ClassID
            WHERE ec.UserID = ?
        `;

        db.query(classQuery, [userID], (error, classResults) => {
            if (error) {
                console.error("Error fetching class details:", error);
                return res.status(500).json({ success: false, message: "Server error" });
            }

            // Now check the payment status for each class
            const classIds = classResults.map(cls => cls.ClassID);
            if (classIds.length === 0) {
                return res.json({
                    success: true,
                    student: studentResults[0],
                    classes: []
                });
            }

            const paymentQuery = `
                SELECT ClassID, Status 
                FROM payment 
                WHERE StudentID = ? AND ClassID IN (?) AND Month = ?
            `;

            db.query(paymentQuery, [studentId, classIds, currentMonth], (error, paymentResults) => {
                if (error) {
                    console.error("Error fetching payment details:", error);
                    return res.status(500).json({ success: false, message: "Server error" });
                }

                // Create a map of classId to payment status
                const paymentStatusMap = {};
                paymentResults.forEach(payment => {
                    paymentStatusMap[payment.ClassID] = payment.Status;
                });

                // Add the payment status to each class result
                const classesWithStatus = classResults.map(cls => {
                    return {
                        ...cls,
                        status: paymentStatusMap[cls.ClassID] || "Not Paid"
                    };
                });

                res.json({
                    success: true,
                    student: studentResults[0],
                    classes: classesWithStatus
                });
            });
        });
    });
};



// process payment
exports.processPayment = (req, res) => {
    const { studentId, paymentDetails } = req.body;
    
    if (!studentId || !paymentDetails || paymentDetails.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid data" });
    }

    const paymentDate = moment().tz('Asia/Colombo').format('YYYY-MM-DD');
    const paymentTime = moment().tz('Asia/Colombo').format('HH:mm:ss');
    const paymentType = "Cash";
    const status = "Paid";

    let query = "INSERT INTO payment (PaymentDate, PaymentTime, Month, Amount, Payment_Type, Status, StudentID, ClassID) VALUES ";
    const values = [];
    paymentDetails.forEach((detail, index) => {
        values.push(
            `('${paymentDate}', '${paymentTime}', '${detail.month}', '${detail.fees}', '${paymentType}', '${status}', '${studentId}', '${detail.id}')`
        );
    });

    query += values.join(", ");
    
    db.query(query, (error, results) => {
        if (error) {
            console.error("Error processing payment:", error);
            return res.status(500).json({ success: false, message: "Server error" });
        }
        res.json({ success: true, message: "Payment processed successfully" });
    });
};




// get tutor payment chart
exports.getTutorPaymentChart = (req, res) => {
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
  
      // Get TutorID from the tutor table using UserID
      const getTutorIDQuery = `SELECT TutorID FROM tutor WHERE UserID = ?`;
      db.query(getTutorIDQuery, [userID], (error, tutorResults) => {
        if (error) {
          console.error("Error fetching TutorID:", error);
          return res.status(500).json({ error: "Error fetching TutorID" });
        }
  
        if (tutorResults.length === 0) {
          return res.status(404).json({ error: "TutorID not found" });
        }
  
        const tutorID = tutorResults[0].TutorID;
  
        // Get ClassID from the class table using TutorID
        const getClassIDQuery = `SELECT ClassID FROM class WHERE TutorID = ?`;
        db.query(getClassIDQuery, [tutorID], (error, classResults) => {
          if (error) {
            console.error("Error fetching ClassID:", error);
            return res.status(500).json({ error: "Error fetching ClassID" });
          }
  
          const classIDs = classResults.map(row => row.ClassID);
  
          // Get total student count and UserID from the enrolledclasses table using ClassID
          const getEnrolledClassIDQuery = `SELECT UserID FROM enrolledclasses WHERE ClassID IN (?)`;
          db.query(getEnrolledClassIDQuery, [classIDs], (error, enrolledResults) => {
            if (error) {
              console.error("Error fetching enrolledclassID:", error);
              return res.status(500).json({ error: "Error fetching enrolledclassID" });
            }
  
            const totalStudentsCount = enrolledResults.length;
            const userIDs = enrolledResults.map(row => row.UserID);
  
            // Get StudentID from the student table using UserID
            const getStudentIDQuery = `SELECT StudentID FROM student WHERE UserID IN (?)`;
            db.query(getStudentIDQuery, [userIDs], (error, studentResults) => {
              if (error) {
                console.error("Error fetching StudentID:", error);
                return res.status(500).json({ error: "Error fetching StudentID" });
              }
  
              const studentIDs = studentResults.map(row => row.StudentID);
  
              // Get payment status from the payment table using StudentID and current month
              const currentMonth = moment().tz('Asia/Colombo').format('MMMM');
  
              const getPaymentStatusQuery = `
                SELECT Status, COUNT(*) as count
                FROM payment
                WHERE StudentID IN (?) AND Month = ?
                GROUP BY Status
              `;
              db.query(getPaymentStatusQuery, [studentIDs, currentMonth], (error, paymentResults) => {
                if (error) {
                  console.error("Error fetching payment status:", error);
                  return res.status(500).json({ error: "Error fetching payment status" });
                }
  
                const paymentData = {
                  paid: 0,
                  notPaid: totalStudentsCount // Initially set to total student count, then reduce for each paid
                };
  
                paymentResults.forEach(row => {
                  if (row.Status === 'Paid') {
                    paymentData.paid = row.count;
                    paymentData.notPaid -= row.count;
                  }
                });
  
                return res.json(paymentData);
              });
            });
          });
        });
      });
    });
  };