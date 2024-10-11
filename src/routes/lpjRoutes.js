const express = require('express');
const router = express.Router();
const multer = require('multer');
const lpjController = require('../controller/lpjController');
const upload = multer();

router.post('/generate-lpj', upload.none(), lpjController.generateLPJ);
router.get('/lpj-history', lpjController.getLPJHistory);
// router.get('/lpj-history/download/:id', lpjController.downloadLPJ);

module.exports = router;
