const express = require('express');
const PaymentController = require('../Controllers/PaymentController');

const router = express.Router();

router.post("/addPayment", PaymentController.addPayment);
router.get("/:studentId", PaymentController.getPaymentSummary);
router.get("/admin/:studentId", PaymentController.getAdminPaymentSummary);
router.post("/admin/processpayment", PaymentController.processPayment);
router.post("/getTutorPaymentChart", PaymentController.getTutorPaymentChart);

module.exports = router;