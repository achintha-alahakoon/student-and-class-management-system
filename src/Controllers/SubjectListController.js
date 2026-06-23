const { Tutor, Class, Grade, Assignment } = require("../Models");
const { Sequelize } = require("sequelize");

exports.getAllSubjects = async (req, res) => {
  try {
    const results = await Tutor.findAll({ attributes: ['Subject'] });
    res.json(results);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ error: "Error fetching subjects" });
  }
};

// get subject averages
exports.getSubjectAverages = async (req, res) => {
  try {
    const results = await Class.findAll({
      attributes: [
        'Subject',
        [Sequelize.fn('ROUND', Sequelize.fn('AVG', Sequelize.col('assignments->grades.Grade')), 2), 'average_score']
      ],
      include: [{
        model: Assignment,
        attributes: [],
        include: [{
          model: Grade,
          attributes: []
        }]
      }],
      group: ['class.Subject'],
      raw: true
    });
    res.json(results);
  } catch (error) {
    console.error("Error fetching subject averages:", error);
    res.status(500).send(error.message);
  }
};

