const Url = require('../models/Url');
const Analytics = require('../models/Analytics');
const { generateShortCode } = require('../utils/base62');
const { redisClient } = require('../config/redis');
const useragent = require('express-useragent');

// @desc    Create short URL
// @route   POST /api/shorten
const shortenUrl = async (req, res) => {
  try {
    const { originalUrl, customAlias, expiresAt } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: 'Original URL is required' });
    }

    let shortCode = customAlias;
    
    // Check if custom alias is provided and available
    if (customAlias) {
      const existingUrl = await Url.findOne({ $or: [{ shortCode: customAlias }, { customAlias }] });
      if (existingUrl) {
        return res.status(400).json({ error: 'Custom alias is already in use' });
      }
    } else {
      // Generate a unique random short code
      let isUnique = false;
      while (!isUnique) {
        shortCode = generateShortCode(6);
        const existingCode = await Url.findOne({ shortCode });
        if (!existingCode) isUnique = true;
      }
    }

    const newUrl = new Url({
      originalUrl,
      shortCode,
      customAlias: customAlias || null,
      expiresAt: expiresAt || null,
      createdBy: req.user ? req.user.userId : null
    });

    await newUrl.save();
    
    // Cache the newly created URL
    if (redisClient.isOpen) {
      await redisClient.setEx(`url:${shortCode}`, 3600, originalUrl); // Cache for 1 hour
    }

    res.status(201).json({
      originalUrl: newUrl.originalUrl,
      shortUrl: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/${shortCode}`,
      shortCode,
      expiresAt: newUrl.expiresAt
    });
  } catch (error) {
    console.error('Error in shortenUrl:', error);
    res.status(500).json({ error: 'Server error while shortening URL' });
  }
};

// @desc    Redirect to original URL
// @route   GET /:shortCode
const redirectUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;

    // 1. Check Cache
    let originalUrl = null;
    if (redisClient.isOpen) {
      originalUrl = await redisClient.get(`url:${shortCode}`);
    }

    // 2. If not in cache, query DB
    if (!originalUrl) {
      const urlDoc = await Url.findOne({ 
        $or: [{ shortCode }, { customAlias: shortCode }] 
      });

      if (!urlDoc) {
        return res.status(404).json({ error: 'URL not found' });
      }

      // Check Expiration
      if (urlDoc.expiresAt && new Date() > urlDoc.expiresAt) {
        return res.status(410).json({ error: 'This URL has expired' });
      }

      originalUrl = urlDoc.originalUrl;

      // Update Cache
      if (redisClient.isOpen) {
        await redisClient.setEx(`url:${shortCode}`, 3600, originalUrl);
      }
      
      // Increment clicks asynchronously
      urlDoc.clicks += 1;
      urlDoc.save().catch(err => console.error('Error updating click count', err));
    } else {
      // Background click increment if served from cache
      Url.updateOne(
        { $or: [{ shortCode }, { customAlias: shortCode }] },
        { $inc: { clicks: 1 } }
      ).catch(err => console.error(err));
    }

    // 3. Track Analytics (Fire & Forget for speed)
    const source = req.headers['user-agent'];
    const ua = useragent.parse(source);
    
    const analytics = new Analytics({
      shortCode,
      country: 'Unknown', // IP geolocation will be added later
      browser: ua.browser || 'Unknown',
      device: ua.isMobile ? 'Mobile' : ua.isDesktop ? 'Desktop' : 'Unknown',
      referrer: req.headers.referer || 'Direct'
    });
    analytics.save().catch(err => console.error('Error saving analytics:', err));

    // 4. Redirect
    return res.redirect(302, originalUrl);

  } catch (error) {
    console.error('Redirect Error:', error);
    res.status(500).json({ error: 'Server error during redirection' });
  }
};

const qrCode = require('qrcode');

// @desc    Get analytics for a short URL
// @route   GET /api/analytics/:shortCode
// @access  Private (or Public depending on implementation - making it private for owner)
const getAnalytics = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const urlDoc = await Url.findOne({ shortCode });
    if (!urlDoc) {
      return res.status(404).json({ error: 'URL not found' });
    }

    // Check if the current user owns this URL
    if (urlDoc.createdBy && urlDoc.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to view these analytics' });
    }

    const analytics = await Analytics.find({ shortCode });

    res.json({
      totalClicks: urlDoc.clicks,
      history: analytics
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Server error fetching analytics' });
  }
};

// @desc    Delete a short URL
// @route   DELETE /api/delete/:shortCode
// @access  Private
const deleteUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const urlDoc = await Url.findOne({ shortCode });
    if (!urlDoc) {
      return res.status(404).json({ error: 'URL not found' });
    }

    if (urlDoc.createdBy && urlDoc.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this URL' });
    }

    await Url.deleteOne({ shortCode });
    await Analytics.deleteMany({ shortCode });
    
    if (redisClient.isOpen) {
      await redisClient.del(`url:${shortCode}`);
    }

    res.json({ message: 'URL deleted successfully' });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ error: 'Server error deleting URL' });
  }
};

// @desc    Generate QR Code for a short URL
// @route   GET /api/qr/:shortCode
// @access  Public
const getQrCode = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const urlDoc = await Url.findOne({ shortCode });

    if (!urlDoc) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const fullUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/${shortCode}`;
    const qrImage = await qrCode.toDataURL(fullUrl);

    res.json({ qrCode: qrImage });
  } catch (error) {
    console.error('QR Code Error:', error);
    res.status(500).json({ error: 'Server error generating QR code' });
  }
};

module.exports = {
  shortenUrl,
  redirectUrl,
  getAnalytics,
  deleteUrl,
  getQrCode
};
