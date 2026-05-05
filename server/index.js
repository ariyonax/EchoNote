require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const logger = require('./config/logger');

// ✅ Metrics
const { promClient, httpRequestDuration, httpRequestTotal } = require('./config/metrics');

const authRoutes = require('./routes/auth');
const audioRoutes = require('./routes/audio');
const transcriptRoutes = require('./routes/transcripts');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) }
}));

// ✅ Metrics middleware — tracks every request
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path;
        httpRequestDuration
            .labels(req.method, route, res.statusCode)
            .observe(duration);
        httpRequestTotal
            .labels(req.method, route, res.statusCode)
            .inc();
    });
    next();
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../client')));
app.use(express.static(path.join(__dirname, '../client/html')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/transcripts', transcriptRoutes);
app.use('/api/admin', adminRoutes);

// ✅ Metrics endpoint — Prometheus scrapes this
app.get('/api/metrics', async (req, res) => {
    try {
        res.set('Content-Type', promClient.register.contentType);
        res.end(await promClient.register.metrics());
    } catch (err) {
        res.status(500).end(err);
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV
    });
});

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../client/html/index.html'));
    }
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

app.listen(PORT, () => {
    logger.info(`EchoNote server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    console.log(`🎙️  EchoNote API → http://localhost:${PORT}`);
});

module.exports = app;