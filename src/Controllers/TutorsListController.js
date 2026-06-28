const { Tutor, User } = require("../Models");

exports.getAllTutors = async (req, res) => {
  const TenantID = req.user?.tenantId ?? req.TenantID;

  if (!TenantID) {
    return res.status(401).json({ error: "Unauthorized: tenant not identified" });
  }

  try {
    const tutors = await Tutor.findAll({
      where: { TenantID },
      attributes: [
        "TutorID",
        "FirstName",
        "LastName",
        "NICNo",
        "Gender",
        "Birthday",
        "TelNo",
        "Email",
        "Subject",
        "Address",
        "UserID",
        "TenantID",
      ],
      include: [
        {
          model: User,
          attributes: ["isActive"],
          // UserID is the FK linking tutor → user
          foreignKey: "UserID",
        },
      ],
    });

    // Flatten isActive from the nested user object into each tutor row
    const result = tutors.map((tutor) => ({
      ...tutor.toJSON(),
      isActive: tutor.user?.isActive ?? true,
      user: undefined, // remove nested user object from response
    }));

    return res.status(200).json({ status: "success", tutors: result });

  } catch (error) {
    console.error("Error fetching tutors:", error);
    return res.status(500).json({ error: "Error fetching tutors" });
  }
};


// get tutor by id
exports.getTutorById = async (req, res) => {
  const { id } = req.params;
  const TenantID = req.user?.tenantId ?? req.TenantID;

  try {
    const tutor = await Tutor.findOne({
      where: { TutorID: id, TenantID },
      include: [{ model: User, attributes: ["isActive"] }],
    });

    if (!tutor) return res.status(404).json({ error: "Tutor not found" });

    const result = {
      ...tutor.toJSON(),
      isActive: tutor.user?.isActive ?? true,
      user: undefined,
    };

    return res.status(200).json({ status: "success", tutor: result });
  } catch (err) {
    console.error("Get tutor error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//delete tutor data
exports.deleteTutor = async (req, res) => {
  const { id }     = req.params;
  const TenantID   = req.user?.tenantId ?? req.TenantID;
 
  try {
    const tutor = await Tutor.findOne({
      where: { TutorID: id, TenantID },
    });
 
    if (!tutor) {
      return res.status(404).json({ error: "Tutor not found" });
    }
 
    const [updated] = await User.update(
      { isActive: false },
      { where: { UserID: tutor.UserID, TenantID } }
    );
 
    if (!updated) {
      return res.status(404).json({ error: "User account not found" });
    }
 
    return res.status(200).json({
      status:  "success",
      message: "Tutor deactivated successfully",
    });
 
  } catch (error) {
    console.error("Error deactivating tutor:", error);
    return res.status(500).json({ error: "Error deactivating tutor" });
  }
};
 
// ── Reactivate tutor ──────────────────────────────────────
exports.activateTutor = async (req, res) => {
  const { id }   = req.params;
  const TenantID = req.user?.tenantId ?? req.TenantID;
 
  try {
    const tutor = await Tutor.findOne({
      where: { TutorID: id, TenantID },
    });
 
    if (!tutor) {
      return res.status(404).json({ error: "Tutor not found" });
    }
 
    const [updated] = await User.update(
      { isActive: true },
      { where: { UserID: tutor.UserID, TenantID } }
    );
 
    if (!updated) {
      return res.status(404).json({ error: "User account not found" });
    }
 
    return res.status(200).json({
      status:  "success",
      message: "Tutor activated successfully",
    });
 
  } catch (error) {
    console.error("Error activating tutor:", error);
    return res.status(500).json({ error: "Error activating tutor" });
  }
};