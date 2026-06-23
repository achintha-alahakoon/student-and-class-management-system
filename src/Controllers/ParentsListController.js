const { Parent, User } = require("../Models");

exports.getAllParents = async (req, res) => {
  try {
    const parents = await Parent.findAll({
      attributes: ['FirstName', 'LastName', 'Gender', 'StudentNo', 'ParentID', 'UserID']
    });
    res.json(parents);
  } catch (error) {
    console.error("Error fetching parents:", error);
    res.status(500).json({ error: "Error fetching parents" });
  }
};

//delete parent data
exports.deleteParent = async (req, res) => {
  const userId = req.params.userId;

  try {
    await Parent.destroy({ where: { UserID: userId } });
    await User.destroy({ where: { UserID: userId } });
    res.json({ message: "Parent and user data deleted successfully." });
  } catch (error) {
    console.error("Error deleting parent or user:", error);
    res.status(500).json({ error: "Error deleting parent or user" });
  }
};