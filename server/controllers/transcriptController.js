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
                   c.category_name, af.original_name, af.file_size
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
            `SELECT t.*, c.category_name, af.original_name, af.file_size, af.upload_date
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
            `UPDATE transcripts SET title = ?, transcript_text = ?, category_id = ?
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
            'SELECT title, transcript_text FROM transcripts WHERE transcript_id = ? AND user_id = ?',
            [req.params.id, req.user.user_id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        const { title, transcript_text } = rows[0];
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${title || 'transcript'}.txt"`);
        res.send(`${title}\n${'='.repeat(title?.length || 10)}\n\n${transcript_text}`);
    } catch (err) {
        res.status(500).json({ error: 'Download failed' });
    }
};

exports.downloadPdf = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT title, transcript_text, generated_at FROM transcripts WHERE transcript_id = ? AND user_id = ?',
            [req.params.id, req.user.user_id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        const { title, transcript_text, generated_at } = rows[0];

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${title || 'transcript'}.pdf"`);
        doc.pipe(res);

        doc.fontSize(20).font('Helvetica-Bold').text('EchoNote Transcript', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).font('Helvetica-Bold').text(title || 'Transcript');
        doc.fontSize(10).font('Helvetica').fillColor('gray')
            .text(`Generated: ${new Date(generated_at).toLocaleDateString()}`);
        doc.moveDown();
        doc.fontSize(12).fillColor('black').font('Helvetica').text(transcript_text, { lineGap: 4 });
        doc.end();
    } catch (err) {
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
