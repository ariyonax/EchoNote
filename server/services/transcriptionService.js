const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const db = require('../config/database');
const logger = require('../config/logger');

const MAX_RETRIES = 3;

async function transcribeAudio(audioId, filePath, userId, retries = 0) {
    try {
        await db.query(
            "UPDATE audio_files SET status = 'processing' WHERE audio_id = ?",
            [audioId]
        );

        logger.info(`Starting transcription for audio ${audioId}`);

        let transcriptText;

        if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === '') {
            // Demo mode
            await new Promise(r => setTimeout(r, 2000));
            transcriptText = `[DEMO MODE - No Groq API key configured]\n\nAdd GROQ_API_KEY to your .env file and re-upload.`;
        } else {
            // Groq Whisper API
            logger.info(`Calling Groq API for audio ${audioId}`);

            const formData = new FormData();
            formData.append('file', fs.createReadStream(filePath));
            formData.append('model', 'whisper-large-v3');
            formData.append('response_format', 'json');
            formData.append('temperature', '0');

            const response = await axios.post(
                'https://api.groq.com/openai/v1/audio/transcriptions',
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                        ...formData.getHeaders()
                    },
                    timeout: 120000
                }
            );

            transcriptText = response.data.text;
            logger.info(`Groq transcription successful for audio ${audioId}`);
        }

        // Save to database
        const originalName = path.basename(filePath, path.extname(filePath));
        await db.query(
            `INSERT INTO transcripts (audio_id, user_id, title, transcript_text, category_id)
             VALUES (?, ?, ?, ?, 1)
             ON DUPLICATE KEY UPDATE transcript_text = VALUES(transcript_text), generated_at = NOW()`,
            [audioId, userId, originalName, transcriptText]
        );

        await db.query(
            "UPDATE audio_files SET status = 'completed' WHERE audio_id = ?",
            [audioId]
        );

        logger.info(`Transcription completed for audio ${audioId}`);
        return transcriptText;

    } catch (err) {
        logger.error(`Transcription error for audio ${audioId}: ${err.message}`);
        if (err.response) {
            logger.error(`Groq API error: ${JSON.stringify(err.response.data)}`);
        }

        if (retries < MAX_RETRIES) {
            const delay = Math.pow(2, retries) * 1000;
            logger.info(`Retrying for audio ${audioId} in ${delay}ms (attempt ${retries + 1})`);
            await new Promise(r => setTimeout(r, delay));
            return transcribeAudio(audioId, filePath, userId, retries + 1);
        }

        await db.query(
            "UPDATE audio_files SET status = 'failed' WHERE audio_id = ?",
            [audioId]
        );
        throw err;
    }
}

module.exports = { transcribeAudio };