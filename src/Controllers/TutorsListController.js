const { Tutor, User } = require("../Models");

exports.getAllTutors = async (req, res) => {
  try {
    const tutors = await Tutor.findAll({
      attributes: ['FirstName', 'LastName', 'Gender', 'Subject', 'TutorID', 'UserID']
    });
    res.json(tutors);
  } catch (error) {
    console.error("Error fetching tutors:", error);
    res.status(500).json({ error: "Error fetching tutors" });
  }
};

//delete tutor data
exports.deleteTutor = async (req, res) => {
  const userId = req.params.userId;

  try {
    await Tutor.destroy({ where: { UserID: userId } });
    await User.destroy({ where: { UserID: userId } });
    res.json({ message: "Tutor and user data deleted successfully." });
  } catch (error) {
    console.error("Error deleting tutor or user:", error);
    res.status(500).json({ error: "Error deleting tutor or user" });
  }
};