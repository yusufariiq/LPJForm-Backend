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
const DESKTOP_DIR = path.join(process.env.DESKTOP_DIR);

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
        const qrCodeImagePath = path.join(DESKTOP_DIR, `qrcode_${uuidv4()}.png`);
        await QRCode.toFile(qrCodeImagePath, data, {
            errorCorrectionLevel: 'H',
            width: 150,
            margin: 1
        });
        return qrCodeImagePath;
    }

    async generateLPJ(formData) {
        try {
            const content = await fsPromises.readFile(TEMPLATE_PATH, 'binary');
            const qrCodeImagePath = await this.generateQRCodeData(formData.no_request);

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
            const outputPath = path.join(DESKTOP_DIR, `LPJ_PUM_Output_${uuidv4()}.pdf`);
            
            await fsPromises.writeFile(outputPath, pdfBuffer);
            await fsPromises.unlink(qrCodeImagePath);

            const savedLpj = await lpjRepository.saveLpj(formData.no_request, formData.tgl_lpj, outputPath);
            console.log('Saved to database with id:', savedLpj.id);

            return outputPath;
        } catch (error) {
            console.error('Error in generateLPJ:', error);
            throw error;
        }
    }

    async getLPJHistory() {
        return await lpjRepository.getLpjHistory();
    }

    // async downloadLPJ(id) {
    //     const lpj = await lpjRepository.getLpjById(id);
    //     if (!lpj) {
    //         throw new Error('File not found');
    //     }
    //     return lpj.file_path;
    // }
}

module.exports = new LPJService();