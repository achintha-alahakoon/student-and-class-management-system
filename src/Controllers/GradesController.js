const { Grade, Assignment, Class, Student, Parent, Tutor, EnrolledClass } = require("../Models");
const jwt = require("jsonwebtoken");

// upload grades
exports.addGrades = async (req, res) => {
  const { StudentID, assignmentTypeID, classID, grade, feedback } = req.body;

  try {
    const assignment = await Assignment.findOne({
      where: { ClassID: classID, assignment_type_id: assignmentTypeID }
    });

    if (!assignment) {
      return res.status(404).send('Assignment not found');
    }

    await Grade.create({
      StudentID: StudentID,
      AssignmentsID: assignment.AssignmentsID,
      Grade: grade,
      Feedback: feedback
    });

    res.status(200).send('Grade added successfully');
  } catch (error) {
    console.error('Error adding grade:', error);
    res.status(500).send('Error adding grade');
  }
};

// get grades
exports.getGrades = async (req, res) => {
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
      const student = await Student.findOne({ where: { UserID: userID } });

      if (!student) {
        return res.status(404).send('Student not found');
      }

      const grades = await Grade.findAll({
        where: { StudentID: student.StudentID },
        include: [{
          model: Assignment,
          attributes: ['assignment_name', 'UploadDate', 'ClassID'],
          include: [{
            model: Class,
            attributes: ['Subject']
          }]
        }]
      });

      if (grades.length === 0) {
        return res.status(200).json({ success: true, message: 'No results yet', data: [] });
      }

      const formattedGrades = grades.map(g => ({
        GradeID: g.GradeID,
        StudentID: g.StudentID,
        AssignmentsID: g.AssignmentsID,
        Grade: g.Grade,
        assignment_name: g.assignment.assignment_name,
        UploadDate: g.assignment.UploadDate,
        ClassID: g.assignment.ClassID,
        Subject: g.assignment.class.Subject
      }));

      res.status(200).json({ success: true, data: formattedGrades });
    } catch (error) {
      console.error('Error fetching grades:', error);
      res.status(500).send('Error fetching grades');
    }
  });
};

// get parent student grades
exports.getParentStudentgrades = async (req, res) => {
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
      const parent = await Parent.findOne({ where: { UserID: userID } });

      if (!parent) {
        return res.status(404).send('Student not found');
      }

      const studentID = parent.StudentNo;

      const grades = await Grade.findAll({
        where: { StudentID: studentID },
        include: [{
          model: Assignment,
          attributes: ['assignment_name', 'UploadDate', 'ClassID'],
          include: [{
            model: Class,
            attributes: ['Subject']
          }]
        }]
      });

      if (grades.length === 0) {
        return res.status(404).send('No grades found');
      }

      const formattedGrades = grades.map(g => ({
        GradeID: g.GradeID,
        StudentID: g.StudentID,
        AssignmentsID: g.AssignmentsID,
        Grade: g.Grade,
        assignment_name: g.assignment.assignment_name,
        UploadDate: g.assignment.UploadDate,
        ClassID: g.assignment.ClassID,
        Subject: g.assignment.class.Subject
      }));

      res.status(200).json({ success: true, data: formattedGrades });
    } catch (error) {
      console.error('Error fetching grades:', error);
      res.status(500).send('Error fetching grades');
    }
  });
};

exports.getGradeHistory = async (req, res) => {
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
      const tutor = await Tutor.findOne({ where: { UserID: userID } });

      if (!tutor) {
        return res.status(404).json({ error: 'TutorID not found' });
      }

      const tutorClasses = await Class.findAll({ where: { TutorID: tutor.TutorID } });
      const classIDs = tutorClasses.map(c => c.ClassID);

      const enrolledClasses = await EnrolledClass.findAll({ where: { ClassID: classIDs } });
      const userIDs = enrolledClasses.map(ec => ec.UserID);

      if (userIDs.length === 0) {
        return res.status(404).json({ error: 'No students found for this tutor' });
      }

      const students = await Student.findAll({ where: { UserID: userIDs } });
      const studentIDs = students.map(s => s.StudentID);

      if (studentIDs.length === 0) {
        return res.status(404).json({ error: 'No students found' });
      }

      const studentDetailsMap = {};
      students.forEach(s => {
        studentDetailsMap[s.StudentID] = { FirstName: s.FirstName, LastName: s.LastName };
      });

      const grades = await Grade.findAll({
        where: { StudentID: studentIDs },
        include: [{
          model: Assignment,
          include: [{ model: Class }]
        }]
      });

      if (grades.length === 0) {
        return res.status(404).json({ error: 'No grades found' });
      }

      const gradeHistory = grades.map(g => {
        const studentDetails = studentDetailsMap[g.StudentID];
        return {
          StudentID: g.StudentID,
          FirstName: studentDetails.FirstName,
          LastName: studentDetails.LastName,
          AssignmentsID: g.AssignmentsID,
          Grade: g.Grade,
          Feedback: g.Feedback,
          ClassID: g.assignment.ClassID,
          assignment_name: g.assignment.assignment_name,
          GradeLevel: g.assignment.class.Grade
        };
      });

      res.status(200).json(gradeHistory);
    } catch (error) {
      console.error("Error fetching grade history:", error);
      res.status(500).json({ error: 'Error fetching grade history' });
    }
  });
};