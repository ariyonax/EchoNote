const express = require('express');
const router = express.Router();
const { uploadAudio, getUploads, deleteUpload, getUploadStatus } = require('../controllers/audioController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);

router.post('/upload', upload.single('audio'), uploadAudio);
router.get('/uploads', getUploads);
router.get('/status/:id', getUploadStatus);
router.delete('/:id', deleteUpload);

module.exports = router;
