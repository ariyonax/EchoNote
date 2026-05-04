-- EchoNote Database Schema
-- Run this file to initialize the database

CREATE DATABASE IF NOT EXISTS echonote_db;
USE echonote_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE
);

-- Insert default categories
INSERT IGNORE INTO categories (category_name) VALUES
    ('Lecture'),
    ('Meeting'),
    ('Interview'),
    ('Personal Notes');

-- Audio files table
CREATE TABLE IF NOT EXISTS audio_files (
    audio_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);

-- Transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
    transcript_id INT AUTO_INCREMENT PRIMARY KEY,
    audio_id INT NOT NULL UNIQUE,
    user_id INT NOT NULL,
    category_id INT DEFAULT 1,
    title VARCHAR(255),
    transcript_text LONGTEXT,
    language VARCHAR(20) DEFAULT 'en',
    duration_seconds INT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (audio_id) REFERENCES audio_files(audio_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FULLTEXT INDEX idx_transcript_text (transcript_text, title),
    INDEX idx_user_id (user_id)
);

-- Create default admin user (password: admin123 - CHANGE IN PRODUCTION)
INSERT IGNORE INTO users (username, email, password_hash, role) VALUES
    ('admin', 'admin@echonote.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin');
