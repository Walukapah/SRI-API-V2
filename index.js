require('dotenv').config();
const express = require('express');
const path = require('path');
const tiktokdl = require('./tiktokdl');
const youtubedl = require('./youtubedl');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Koyeb
app.set('trust proxy', true);

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip
});
app.use(limiter);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// API endpoints
app.get('/api/tiktok', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url || !url.includes('tiktok.com')) {
      return res.status(400).json({ 
        status: false, 
        message: "Please provide a valid TikTok URL" 
      });
    }
    const data = await tiktokdl(url);
    res.json(data);
  } catch (error) {
    console.error('TikTok API Error:', error);
    res.status(500).json({ 
      status: false, 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.get('/api/youtube', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url || !url.includes('youtube.com') && !url.includes('youtu.be')) {
      return res.status(400).json({ 
        status: false, 
        message: "Please provide a valid YouTube URL" 
      });
    }
    const data = await youtubedl(url);
    res.json(data);
  } catch (error) {
    console.error('YouTube API Error:', error);
    res.status(500).json({ 
      status: false, 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// All other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
