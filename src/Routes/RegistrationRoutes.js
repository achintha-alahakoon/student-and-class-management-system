const express = require('express');
const auth = require("../middleware/auth");
const RegistrationController = require('../Controllers/RegistrationController');

const router = express.Router();

router.post("/student", auth, RegistrationController.registerStudent);
router.post("/parent", auth, RegistrationController.registerParent);
router.post("/tutor", auth, RegistrationController.registerTutor);

module.exports = router;