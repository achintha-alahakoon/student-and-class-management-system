const express = require('express');
const RegistrationController = require('../Controllers/RegistrationController');

const router = express.Router();

router.post("/student", RegistrationController.registerStudent);
router.post("/parent", RegistrationController.registerParent);
router.post("/tutor", RegistrationController.registerTutor);

module.exports = router;