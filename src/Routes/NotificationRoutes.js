const express = require('express');
const NotificationController = require('../Controllers/NotificationController');

const router = express.Router();

router.post('/send', NotificationController.sendNotification);
router.get('/messages', NotificationController.getMessages);
router.post('/updateStatus', NotificationController.updateMessageStatus);

module.exports = router;