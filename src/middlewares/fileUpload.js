const multer = require("multer");
const path = require("path");
const { S3Client } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
const config = require("../config/config");

module.exports = function (UPLOADS_FOLDER, allowedMimeTypes) {
  
  const STORAGE_MODE = config.storage.mode; 

  let storage;

  if (STORAGE_MODE === "s3") {
    console.log("[Info] STORAGE MODE: S3/Supabase ACTIVE");
    
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
        const fileExt = file.originalname.split(".").pop();
        const filename = file.originalname
          .replace(`.${fileExt}`, "")
          .toLocaleLowerCase()
          .split(" ")
          .join("-") + "-" + Date.now();
        cb(null, `${filename}.${fileExt}`);
      },
    });
  } else {
    console.log("[Info] STORAGE MODE: LOCAL DISK ACTIVE");
    
    storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, UPLOADS_FOLDER);
      },
      filename: (req, file, cb) => {
        const fileExt = path.extname(file.originalname);
        const filename = file.originalname
          .replace(fileExt, "")
          .toLocaleLowerCase()
          .split(" ")
          .join("-") + "-" + Date.now();
        cb(null, filename + fileExt);
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
