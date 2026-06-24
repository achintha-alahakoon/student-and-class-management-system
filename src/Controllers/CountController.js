const { Student, Tutor, Parent, Class } = require("../Models");
const { Sequelize } = require("sequelize");

// Get count of students, tutors, parents, and unique subjects
exports.getCounts = async (req, res) => {
  try {
    const [studentCount, tutorCount, parentCount, subjectCount] = await Promise.all([
      Student.count(),
      Tutor.count(),
      Parent.count(),
      Tutor.count({ distinct: true, col: 'Subject' })
    ]);

    res.json({ studentCount, tutorCount, parentCount, subjectCount });
  } catch (error) {
    console.error("Error fetching counts:", error);
    res.status(500).json({ error: "Error fetching counts" });
  }
};

// get All distinct tutors, grades, subjects
exports.getAll = async (req, res) => {
  try {
    const [tutorResults, gradeResults, subjectResults] = await Promise.all([
      Class.findAll({ attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('Tutor')), 'Tutor']], raw: true }),
      Class.findAll({ attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('Grade')), 'Grade']], raw: true }),
      Class.findAll({ attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('Subject')), 'Subject']], raw: true })
    ]);

    res.json({
      tutors: tutorResults.map(row => row.Tutor),
      grades: gradeResults.map(row => row.Grade),
      subjects: subjectResults.map(row => row.Subject)
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  }
};