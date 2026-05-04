const db = require('../config/database');
const logger = require('../config/logger');

exports.getStats = async (req, res) => {
    try {
        const [[{ total_users }]] = await db.query('SELECT COUNT(*) as total_users FROM users WHERE role = "user"');
        const [[{ total_uploads }]] = await db.query('SELECT COUNT(*) as total_uploads FROM audio_files');
        const [[{ total_transcripts }]] = await db.query('SELECT COUNT(*) as total_transcripts FROM transcripts');
        const [[{ uploads_today }]] = await db.query(
            'SELECT COUNT(*) as uploads_today FROM audio_files WHERE DATE(upload_date) = CURDATE()'
        );

        const [categoryStats] = await db.query(
            `SELECT c.category_name, COUNT(t.transcript_id) as count
             FROM categories c LEFT JOIN transcripts t ON c.category_id = t.category_id
             GROUP BY c.category_id ORDER BY count DESC`
        );

        const [recentUsers] = await db.query(
            'SELECT user_id, username, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10'
        );

        const [recentUploads] = await db.query(
            `SELECT af.audio_id, af.original_name, af.status, af.upload_date, u.username
             FROM audio_files af JOIN users u ON af.user_id = u.user_id
             ORDER BY af.upload_date DESC LIMIT 10`
        );

        res.json({
            stats: { total_users, total_uploads, total_transcripts, uploads_today },
            categoryStats,
            recentUsers,
            recentUploads
        });
    } catch (err) {
        logger.error('Admin stats error:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT u.user_id, u.username, u.email, u.role, u.created_at,
                    COUNT(DISTINCT af.audio_id) as total_uploads,
                    COUNT(DISTINCT t.transcript_id) as total_transcripts
             FROM users u
             LEFT JOIN audio_files af ON u.user_id = af.user_id
             LEFT JOIN transcripts t ON u.user_id = t.user_id
             GROUP BY u.user_id ORDER BY u.created_at DESC`
        );
        res.json({ users: rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (parseInt(id) === req.user.user_id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        const [result] = await db.query('DELETE FROM users WHERE user_id = ? AND role != "admin"', [id]);
        if (!result.affectedRows) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
