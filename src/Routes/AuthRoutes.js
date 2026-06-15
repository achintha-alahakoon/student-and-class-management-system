const express = require('express');
const AuthController = require('../Controllers/AuthController');

const router = express.Router();

router.post('/login', AuthController.login);
router.get('/:userId', AuthController.getUser);

module.exports = router;
