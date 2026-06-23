const express = require('express');
const CountController = require('../Controllers/CountController');

const router = express.Router();

router.get('/getCounts', CountController.getCounts);
router.get('/getAll', CountController.getAll);

module.exports = router;