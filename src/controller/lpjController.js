const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path')
const LPJService = require('../services/lpjService');

const uploadDir = path.join(__dirname, '..', 'temp');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

class LPJController {
    async generateLPJ(req, res) {
        try {
            const result = await LPJService.generateLPJ(req.body);
            const filePath = path.join(uploadDir, result.filename);

            res.contentType('application/pdf');
            res.sendFile(filePath, (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    res.status(500).send('Error sending file');
                }
    
                if (result.qrCodePath) {
                    fs.unlink(result.qrCodePath, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error('Error deleting temporary QR code file:', unlinkErr);
                        }
                    });
                }
            });
        } catch (error) {
            console.error('Error generating LPJ:', error);
            res.status(500).send(`Server error: ${error.message}`);
        }
    }

    async getLPJHistory(req, res) {
        try {
            const history = await LPJService.getLPJHistory();
            res.json(history);
        } catch(error) {
            console.log(`Error fetching LPJ history: `, error);
            res.status(500).json({ error: 'Error fetching LPJ history'});
        }
    }
    
    async getLPJFile(req, res) {
        try {
            const filename = req.params.filename;
            
            if(!filename) {
                console.log('No filename provided');
                return res.status(400).json({error: 'No filename provided'})
            }

            console.log('Current directory:', __dirname);
            console.log('Upload directory:', uploadDir);
            
            const filepath = path.join(uploadDir, filename);
            console.log('Attempting to access file at:', filepath);

            try {
                await fsPromises.access(filepath, fs.constants.F_OK);
                
                const stats = await fsPromises.stat(filepath);
                if (!stats.isFile()) {
                    throw new Error('Not a file');
                }

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

                const fileStream = fs.createReadStream(filepath);
                
                fileStream.on('error', (error) => {
                    console.error('Error streaming file:', error);
                    if (!res.headersSent) {
                        res.status(500).json({ error: 'Error streaming file' });
                    }
                });

                fileStream.pipe(res);
            } catch (error) {
                console.log('File not found:', filepath);
                return res.status(404).json({ 
                    error: 'File not found',
                    details: {
                        requestedFile: filename,
                        attemptedPath: filepath,
                        errorMessage: error.message
                    }
                });
            }
        } catch (error) {
            console.error('Error serving file:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new LPJController();