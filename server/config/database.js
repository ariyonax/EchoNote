const mysql = require('mysql2/promise');
const logger = require('./logger');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'echonote_user',
    password: process.env.DB_PASSWORD || 'echonote_pass',
    database: process.env.DB_NAME || 'echonote_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test connection on startup
pool.getConnection()
    .then(conn => {
        logger.info('✅ MySQL database connected successfully');
        conn.release();
    })
    .catch(err => {
        logger.error('❌ MySQL connection failed:', err.message);
        process.exit(1);
    });

module.exports = pool;
