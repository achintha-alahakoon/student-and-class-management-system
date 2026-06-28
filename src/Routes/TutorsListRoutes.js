const express = require('express');
const auth = require("../middleware/auth");
const TutorsListController = require('../Controllers/TutorsListController');

const router = express.Router();

router.get("/tutorslist", auth, TutorsListController.getAllTutors);
router.get("/:id", auth, TutorsListController.getTutorById);
router.delete("/:id", auth, TutorsListController.deleteTutor);
router.patch("/:id/activate", auth, TutorsListController.activateTutor);

module.exports = router;