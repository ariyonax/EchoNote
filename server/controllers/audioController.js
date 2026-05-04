const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const logger = require('../config/logger');
const transcriptionService = require('../services/transcriptionService');

exports.uploadAudio = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

    const { originalname, filename, path: filePath, size, mimetype } = req.file;
    const userId = req.user.user_id;

    let audioId;
    try {
        const [result] = await db.query(
            `INSERT INTO audio_files (user_id, filename, original_name, file_path, file_size, mime_type, status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [userId, filename, originalname, filePath, size, mimetype]
        );
        audioId = result.insertId;

        res.status(202).json({
            message: 'File uploaded. Transcription started.',
            audio_id: audioId,
            filename: originalname,
            status: 'processing'
        });

        // Run transcription asynchronously
        transcriptionService.transcribeAudio(audioId, filePath, userId)
            .catch(err => logger.error(`Transcription failed for audio ${audioId}:`, err));

    } catch (err) {
        logger.error('Upload error:', err);
        if (req.file) fs.unlink(req.file.path, () => {});
        res.status(500).json({ error: 'Upload failed' });
    }
};

exports.getUploads = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT af.*, t.transcript_id, t.title, c.category_name
             FROM audio_files af
             LEFT JOIN transcripts t ON af.audio_id = t.audio_id
             LEFT JOIN categories c ON t.category_id = c.category_id
             WHERE af.user_id = ?
             ORDER BY af.upload_date DESC
             LIMIT 50`,
            [req.user.user_id]
        );
        res.json({ uploads: rows });
    } catch (err) {
        logger.error('Get uploads error:', err);
        res.status(500).json({ error: 'Failed to fetch uploads' });
    }
};

exports.deleteUpload = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            'SELECT * FROM audio_files WHERE audio_id = ? AND user_id = ?',
            [id, req.user.user_id]
        );

        if (!rows.length) return res.status(404).json({ error: 'File not found' });

        fs.unlink(rows[0].file_path, () => {});
        await db.query('DELETE FROM audio_files WHERE audio_id = ?', [id]);

        res.json({ message: 'File deleted successfully' });
    } catch (err) {
        logger.error('Delete upload error:', err);
        res.status(500).json({ error: 'Failed to delete file' });
    }
};

exports.getUploadStatus = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT audio_id, status FROM audio_files WHERE audio_id = ? AND user_id = ?',
            [req.params.id, req.user.user_id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get status' });
    }
};
