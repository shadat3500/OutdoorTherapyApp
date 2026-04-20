const heicConvert = require('heic-convert');
const fs = require('fs');
const path = require('path');
const catchAsync = require('../utils/catchAsync');

const convertHeicToPngMiddleware = (folderPath) =>
  catchAsync(async (req, res, next) => {
    if (!req.file && (!req.files || req.files.length === 0)) {
      return next();
    }

    const files = req.file ? [req.file] : req.files;

    for (const file of files) {
      if (path.extname(file.originalname).toLowerCase() === '.heic') {
        const inputBuffer = fs.readFileSync(file.path);
        const outputBuffer = await heicConvert({
          buffer: inputBuffer,
          format: 'PNG',
        });

        const newFileName = `${path.basename(file.filename, '.heic')}.png`;
        const newFilePath = path.join(folderPath, newFileName);

        fs.writeFileSync(newFilePath, outputBuffer);
        fs.unlinkSync(file.path); // remove old heic file

        file.path = newFilePath;
        file.filename = newFileName;
        file.mimetype = 'image/png';
      }
    }

    next();
  });

module.exports = convertHeicToPngMiddleware;
