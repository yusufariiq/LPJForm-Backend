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

    // async downloadLPJ(req, res) {
    //     try {
    //         const filePath = await LPJService.downloadLPJ(req.params.id);

    //         if(!fs.existsSync(filePath)) {
    //             console.error(`File ${filePath} does not exist`);
    //             return res.status(404).send('File not found');
    //         }

    //         const fileName = path.basename(filePath);
    //         res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    //         res.setHeader('Content-Type', 'application/pdf');

    //         const fileStream = fs.createReadStream(filePath);
    //         fileStream.on('error', (error) => {
    //         console.error(`Error reading file: ${error}`);
    //         res.status(500).send('Error reading file from server');
    //         });
    //         fileStream.pipe(res);
    //     } catch (error) {
    //         console.error('Error during file download:', error);
    //         res.status(500).send('Server error during the file download');
    //     }
    // }
}

module.exports = new LPJController();