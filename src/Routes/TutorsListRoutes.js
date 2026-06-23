const express = require('express');
const TutorsListController = require('../Controllers/TutorsListController');

const router = express.Router();

router.get("/tutorslist", TutorsListController.getAllTutors);
router.delete("/:userId", TutorsListController.deleteTutor);

module.exports = router;