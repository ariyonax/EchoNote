const db = require('../config/database');
const logger = require('../config/logger');
const PDFDocument = require('pdfkit');

exports.getTranscripts = async (req, res) => {
    try {
        const { page = 1, limit = 10, category } = req.query;
        const offset = (page - 1) * limit;
        const userId = req.user.user_id;

        let query = `
            SELECT t.transcript_id, t.title, t.generated_at, t.updated_at,
                   LEFT(t.transcript_text, 200) as excerpt,
                   c.category_name, af.original_name, af.file_size,
                   LENGTH(t.transcript_text) - LENGTH(REPLACE(t.transcript_text, ' ', '')) + 1 as word_count
            FROM transcripts t
            JOIN audio_files af ON t.audio_id = af.audio_id
            LEFT JOIN categories c ON t.category_id = c.category_id
            WHERE t.user_id = ?`;
        const params = [userId];

        if (category) {
            query += ' AND c.category_name = ?';
            params.push(category);
        }

        query += ' ORDER BY t.generated_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await db.query(query, params);
        const [[{ total }]] = await db.query(
            'SELECT COUNT(*) as total FROM transcripts WHERE user_id = ?', [userId]
        );

        res.json({ transcripts: rows, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        logger.error('Get transcripts error:', err);
        res.status(500).json({ error: 'Failed to fetch transcripts' });
    }
};

exports.getTranscript = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT t.*, c.category_name, af.original_name, af.file_size, af.upload_date,
                    LENGTH(t.transcript_text) - LENGTH(REPLACE(t.transcript_text, ' ', '')) + 1 as word_count
             FROM transcripts t
             JOIN audio_files af ON t.audio_id = af.audio_id
             LEFT JOIN categories c ON t.category_id = c.category_id
             WHERE t.transcript_id = ? AND t.user_id = ?`,
            [req.params.id, req.user.user_id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Transcript not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch transcript' });
    }
};

exports.updateTranscript = async (req, res) => {
    try {
        const { title, transcript_text, category_id } = req.body;
        const [result] = await db.query(
            `UPDATE transcripts SET title = ?, transcript_text = ?, category_id = ?, updated_at = NOW()
             WHERE transcript_id = ? AND user_id = ?`,
            [title, transcript_text, category_id, req.params.id, req.user.user_id]
        );
        if (!result.affectedRows) return res.status(404).json({ error: 'Transcript not found' });
        res.json({ message: 'Transcript updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update transcript' });
    }
};

exports.deleteTranscript = async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM transcripts WHERE transcript_id = ? AND user_id = ?',
            [req.params.id, req.user.user_id]
        );
        if (!result.affectedRows) return res.status(404).json({ error: 'Transcript not found' });
        res.json({ message: 'Transcript deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete transcript' });
    }
};

exports.searchTranscripts = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) return res.status(400).json({ error: 'Search query too short' });

        const [rows] = await db.query(
            `SELECT t.transcript_id, t.title, t.generated_at,
                    LEFT(t.transcript_text, 300) as excerpt,
                    c.category_name,
                    MATCH(t.transcript_text, t.title) AGAINST(? IN BOOLEAN MODE) as relevance
             FROM transcripts t
             LEFT JOIN categories c ON t.category_id = c.category_id
             WHERE t.user_id = ? AND MATCH(t.transcript_text, t.title) AGAINST(? IN BOOLEAN MODE)
             ORDER BY relevance DESC LIMIT 20`,
            [q, req.user.user_id, q]
        );
        res.json({ results: rows, query: q });
    } catch (err) {
        logger.error('Search error:', err);
        res.status(500).json({ error: 'Search failed' });
    }
};

exports.downloadTxt = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT t.title, t.transcript_text, t.generated_at, c.category_name, af.original_name
             FROM transcripts t
             LEFT JOIN categories c ON t.category_id = c.category_id
             JOIN audio_files af ON t.audio_id = af.audio_id
             WHERE t.transcript_id = ? AND t.user_id = ?`,
            [req.params.id, req.user.user_id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Not found' });

        const { title, transcript_text, generated_at, category_name, original_name } = rows[0];
        const safeTitle = (title || 'transcript').replace(/[^a-zA-Z0-9\s\-_]/g, '').trim();
        const wordCount = transcript_text ? transcript_text.split(/\s+/).filter(Boolean).length : 0;
        const date = new Date(generated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const content = [
            '═'.repeat(60),
            `  ECHONOTE TRANSCRIPT`,
            '═'.repeat(60),
            ``,
            `  Title    : ${title || 'Untitled'}`,
            `  Category : ${category_name || 'Uncategorized'}`,
            `  Date     : ${date}`,
            `  File     : ${original_name || 'N/A'}`,
            `  Words    : ${wordCount}`,
            ``,
            '─'.repeat(60),
            ``,
            transcript_text || '',
            ``,
            '─'.repeat(60),
            `  Generated by EchoNote`,
            '═'.repeat(60),
        ].join('\n');

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.txt"`);
        res.send(content);
    } catch (err) {
        logger.error('TXT download error:', err);
        res.status(500).json({ error: 'Download failed' });
    }
};

exports.downloadPdf = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT t.title, t.transcript_text, t.generated_at, c.category_name, af.original_name
             FROM transcripts t
             LEFT JOIN categories c ON t.category_id = c.category_id
             JOIN audio_files af ON t.audio_id = af.audio_id
             WHERE t.transcript_id = ? AND t.user_id = ?`,
            [req.params.id, req.user.user_id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Not found' });

        const { title, transcript_text, generated_at, category_name, original_name } = rows[0];
        const safeTitle = (title || 'transcript').replace(/[^a-zA-Z0-9\s\-_]/g, '').trim();
        const wordCount = transcript_text ? transcript_text.split(/\s+/).filter(Boolean).length : 0;
        const date = new Date(generated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const doc = new PDFDocument({ margin: 60, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.pdf"`);
        doc.pipe(res);

        // Header bar
        doc.rect(0, 0, doc.page.width, 80).fill('#1a1a2e');
        doc.fontSize(22).font('Helvetica-Bold').fillColor('white')
            .text('EchoNote', 60, 25);
        doc.fontSize(11).font('Helvetica').fillColor('#a0a0c0')
            .text('AI Transcription Platform', 60, 52);

        doc.moveDown(3);

        // Title
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a1a2e')
            .text(title || 'Untitled Transcript', { align: 'left' });
        doc.moveDown(0.5);

        // Meta info row
        doc.fontSize(10).font('Helvetica').fillColor('#666666');
        doc.text(`Category: ${category_name || 'Uncategorized'}   |   Date: ${date}   |   Words: ${wordCount}   |   File: ${original_name || 'N/A'}`);
        doc.moveDown(0.5);

        // Divider line
        doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).strokeColor('#e0e0e0').lineWidth(1).stroke();
        doc.moveDown(1);

        // Transcript text
        doc.fontSize(12).font('Helvetica').fillColor('#2d2d2d')
            .text(transcript_text || '', {
                lineGap: 6,
                paragraphGap: 10,
                align: 'justify'
            });

        doc.moveDown(2);

        // Footer
        doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).strokeColor('#e0e0e0').lineWidth(1).stroke();
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor('#999999').font('Helvetica')
            .text(`Generated by EchoNote on ${new Date().toLocaleDateString()}`, { align: 'center' });

        doc.end();
    } catch (err) {
        logger.error('PDF download error:', err);
        res.status(500).json({ error: 'PDF generation failed' });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories ORDER BY category_id');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};