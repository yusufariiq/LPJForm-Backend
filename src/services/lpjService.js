const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const libre = require('libreoffice-convert');
const util = require('util');
const QRCode = require('qrcode');
const ImageModule = require('docxtemplater-image-module-free');
const { v4: uuidv4 } = require('uuid');
const lpjRepository = require('../repositories/lpjRepository');
const libreConvert = util.promisify(libre.convert);

const TEMPLATE_PATH = path.resolve(process.env.TEMPLATE_PATH);
const UPLOAD_DIR = path.join(process.env.DESKTOP_DIR);

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

class LPJService {
    formatCurrency(amount) {
        if (isNaN(amount) || amount === undefined) {
            console.error('Invalid amount for currency formatting:', amount);
            return 'Rp 0';
        }
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    async generateQRCodeData(data) {
        const qrCodeFilename = `qrcode_${uuidv4()}.png`;
        const qrCodePath = path.join(UPLOAD_DIR, qrCodeFilename);
        await QRCode.toFile(qrCodePath, data, {
            errorCorrectionLevel: 'H',
            width: 150,
            margin: 1
        });
        return qrCodePath;
    }

    async generateLPJ(formData) {
        try {
            const pdfFilename = `LPJ_PUM_${Date.now()}-${Math.round(Math.random() * 1E9)}.pdf`;

            const qrCodeImagePath = await this.generateQRCodeData(formData.no_request);

            const content = await fsPromises.readFile(TEMPLATE_PATH, 'binary');
            const zip = new PizZip(content);

            const imageModule = new ImageModule({
                centered: false,
                fileType: 'docx',
                getImage: function(tagValue) {
                    return fs.readFileSync(tagValue);
                },
                getSize: function() {
                    return [150, 150];
                }
            });

            const doc = new Docxtemplater(zip, {
                modules: [imageModule],
                paragraphLoop: true,
                linebreaks: true,
                delimiters: {
                    start: '{',
                    end: '}',
                }
            });

            const { rincianItems } = formData;
            
            const total_pum = rincianItems.reduce((sum, item) => sum + Number(item.jumlah_pum), 0);
            const total_lpj = rincianItems.reduce((sum, item) => sum + Number(item.jumlah_lpj), 0);

            const templateData = {
                ...formData,
                tgl_lpj: new Date(formData.tgl_lpj).toLocaleDateString('id-ID'),
                qrcode: qrCodeImagePath,
                rincianItems: rincianItems.map((item) => ({
                    no: item.no,
                    deskripsi_pum: item.deskripsi_pum,
                    jumlah_pum: this.formatCurrency(Number(item.jumlah_pum)),
                    deskripsi_lpj: item.deskripsi_lpj,
                    jumlah_lpj: this.formatCurrency(Number(item.jumlah_lpj))
                })),
                total_pum: this.formatCurrency(total_pum),
                total_lpj: this.formatCurrency(total_lpj)
            };

            doc.render(templateData);

            const filledContent = doc.getZip().generate({ type: 'nodebuffer' });
            const pdfBuffer = await libreConvert(filledContent, '.pdf', undefined);

            const outputPath = path.join(UPLOAD_DIR, pdfFilename);
            await fsPromises.writeFile(outputPath, pdfBuffer);
            
            await fsPromises.unlink(qrCodeImagePath);

            const savedLpj = await lpjRepository.saveLpj(formData.no_request, formData.tgl_lpj, pdfFilename);
            console.log('Saved to database with id:', savedLpj.id);

            return {
                id: savedLpj.id,
                filename: pdfFilename,
                filePath: outputPath
            };
        } catch (error) {
            console.error('Error in generateLPJ:', error);
            throw error;
        }
    }

    async getLPJHistory() {
        const history =  await lpjRepository.getLpjHistory();

        return history.map(item => ({
            ...item,
            file_path: path.join(UPLOAD_DIR, item.file_path)
        }));
    }

    async getLPJHistory() {
        const history =  await lpjRepository.getLpjHistory();

        return history.map(item => ({
            ...item,
            filePath: path.join(UPLOAD_DIR, item.file_path),
            fileName: item.file_path
        }));
    }

    
    async downloadLPJ(id) {
        const lpj = await lpjRepository.getLpjById(id);
        if (!lpj) {
            throw new Error('File not found');
        }

        const filePath = path.join(UPLOAD_DIR, lpj.file_path);
        
        if (!fs.existsSync(filePath)) {
            throw new Error('File not found in storage');
        }

        return {
            filePath,
            fileName: lpj.file_path
        };
    }
}

module.exports = new LPJService();