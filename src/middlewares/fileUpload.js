const multer = require("multer");
const path = require("path");
const { S3Client } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
const config = require("../config/config");

/**
 * Utility to generate a clean filename
 */
const generateFilename = (originalname) => {
  const fileExt = path.extname(originalname);
  const namePart = originalname
    .replace(fileExt, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/-+/g, "-") // Remove double hyphens
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
  
  return `${namePart}-${Date.now()}${fileExt}`;
};

/**
 * Utility to clean folder path for S3/R2 keys
 * Removes leading './' or '/'
 */
const getCleanPath = (folder) => {
  return folder.replace(/^\.\//, "").replace(/^\//, "");
};

module.exports = function (UPLOADS_FOLDER, allowedMimeTypes) {
  const STORAGE_MODE = config.storage.mode; 
  let storage;

  if (STORAGE_MODE === "s3") {
    console.log("[Info] STORAGE MODE: S3/R2 ACTIVE");
    
    const s3Config = {
      region: config.storage.s3.region,
      credentials: {
        accessKeyId: config.storage.s3.accessKey,
        secretAccessKey: config.storage.s3.secretKey,
      },
    };

    if (config.storage.s3.endpoint) {
      s3Config.endpoint = config.storage.s3.endpoint;
      s3Config.forcePathStyle = true;
    }

    const s3 = new S3Client(s3Config);

    storage = multerS3({
      s3: s3,
      bucket: config.storage.s3.bucket,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: function (req, file, cb) {
        const filename = generateFilename(file.originalname);
        const folder = getCleanPath(UPLOADS_FOLDER);
        // Save with folder prefix in R2/S3: e.g. uploads/users/filename.jpg
        cb(null, `${folder}/${filename}`);
      },
    });
  } else {
    console.log("[Info] STORAGE MODE: LOCAL DISK ACTIVE");
    
    storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, UPLOADS_FOLDER);
      },
      filename: (req, file, cb) => {
        cb(null, generateFilename(file.originalname));
      },
    });
  }

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 100 * 1024 * 1024, // 100 MB
    },
    fileFilter: (req, file, cb) => {
      const defaultTypes = [
        "image/jpg", "image/png", "image/jpeg", "image/heic", "image/heif", "image/webp",
        "audio/mpeg", "audio/wav", "audio/mp3", "audio/x-wav",
        "video/mp4", "video/webm", "video/quicktime",
        "application/pdf"
      ];
      const types = allowedMimeTypes || defaultTypes;

      if (types.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} not allowed.`));
      }
    },
  });

  return upload;
};
