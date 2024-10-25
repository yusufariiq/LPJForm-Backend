const fs = require('fs');
const LPJService = require('../services/lpjService');

class LPJController {
    async generateLPJ(req, res) {
        try {
            const outputPath = await LPJService.generateLPJ(req.body);

            res.contentType('application/pdf');
            res.sendFile(outputPath, (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    res.status(500).send('Error sending file');
                }
    
                fs.unlink(outputPath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Error deleting temporary file:', unlinkErr);
                    }
                });
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

    // async getAttachment(req, res) {
    //     try {
    //         const filename = req.params.filename;
            
    //         if(!filename) {
    //             console.log('No filename provided');
    //             return res.status(400).json({error: 'No filename provided'})
    //         }

    //         const filepath = path.join(uploadDir, filename);

    //         try {
    //             await fs.access(filepath);
    //             const ext = path.extname(filename).toLowerCase();
    //             const contentType = {
    //                 '.png': 'image/png',
    //                 '.jpg': 'image/jpeg',
    //                 '.jpeg': 'image/jpeg',
    //                 '.pdf': 'application/pdf'
    //             }[ext] || 'application/octet-stream';
                
    //             res.setHeader('Content-Type', contentType);
    //             res.setHeader('Cache-Control', 'no-cache');
    //             res.setHeader('Content-Disposition', 'inline');

    //             const fileStream = fsSync.createReadStream(filepath);
    //             fileStream.pipe(res);
    //             // res.sendFile(filepath);
    //         } catch (error) {
    //             console.log('File not found: ', filepath);
    //             return res.status(404).json({ 
    //                 error: 'File not found',
    //                 details: {
    //                     requestedFile: filename,
    //                     attemptedPath: filepath
    //                 }
    //             });
    //         }
    //     } catch (error) {
    //         console.error('Error serving attachment:', error);
    //         res.status(500).json({ error: 'Internal server error' });
    //     }
    // }

    async downloadLPJ(req, res) {
        try {
            const { id } = req.params;
            const fileInfo = await lpjService.downloadLPJ(id);
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.fileName}"`);
            
            // Send the file
            res.sendFile(fileInfo.filePath);
        } catch (error) {
            console.error('Error downloading file:', error);
            res.status(404).send('File not found');
        }
    }
}

module.exports = new LPJController();