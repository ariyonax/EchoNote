const express = require('express');
const router = express.Router();
const {
    getTranscripts, getTranscript, updateTranscript,
    deleteTranscript, searchTranscripts, downloadTxt,
    downloadPdf, getCategories
} = require('../controllers/transcriptController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/categories', getCategories);
router.get('/search', searchTranscripts);
router.get('/', getTranscripts);
router.get('/:id', getTranscript);
router.put('/:id', updateTranscript);
router.delete('/:id', deleteTranscript);
router.get('/:id/download/txt', downloadTxt);
router.get('/:id/download/pdf', downloadPdf);

module.exports = router;
