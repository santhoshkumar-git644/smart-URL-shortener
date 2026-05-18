const express = require('express');
const router = express.Router();
const { shortenUrl, getAnalytics, deleteUrl, getQrCode } = require('../controllers/urlController');
const { protect, optionalAuth } = require('../middleware/auth');

// Define API routes
router.post('/shorten', optionalAuth, shortenUrl);
router.get('/analytics/:shortCode', protect, getAnalytics);
router.delete('/delete/:shortCode', protect, deleteUrl);
router.get('/qr/:shortCode', getQrCode);

module.exports = router;
