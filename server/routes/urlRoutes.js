const express = require('express');
const router = express.Router();
const { shortenUrl, shortenBatch, getAnalytics, deleteUrl, getQrCode, getUserUrls } = require('../controllers/urlController');
const { protect, optionalAuth } = require('../middleware/auth');

// Define API routes
router.post('/shorten', optionalAuth, shortenUrl);
router.post('/batch', optionalAuth, shortenBatch);
router.get('/urls', protect, getUserUrls);
router.get('/analytics/:shortCode', protect, getAnalytics);
router.delete('/delete/:shortCode', protect, deleteUrl);
router.get('/qr/:shortCode', getQrCode);

module.exports = router;
