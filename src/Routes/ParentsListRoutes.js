const express = require('express');
const ParentsListController = require('../Controllers/ParentsListController');

const router = express.Router();

router.get("/parentslist", ParentsListController.getAllParents);
router.delete("/:userId", ParentsListController.deleteParent);

module.exports = router;