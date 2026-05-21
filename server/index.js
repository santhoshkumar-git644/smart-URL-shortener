require('dotenv').config();
const express = require('express');
const cors = require('cors');
const useragent = require('express-useragent');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');

// Import routes
const urlRoutes = require('./routes/urlRoutes');
const { redirectUrl } = require('./controllers/urlController');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(useragent.express());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 10 minutes)
  message: { error: 'Too many requests, please try again later.' }
});

// Apply rate limiting to all API requests
app.use('/api', limiter);

// Connect to Databases
connectDB();
connectRedis();

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api', urlRoutes);

// Redirection Route (Root level)
app.get('/:shortCode', redirectUrl);

// Health Check
app.get('/', (req, res) => {
  res.send('Smart URL Shortener API is running...');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
