const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const config = require('../config/config');

const s3Client = new S3Client({
  region: config.storage.s3.region,
  credentials: {
    accessKeyId: config.storage.s3.accessKey,
    secretAccessKey: config.storage.s3.secretKey,
  },
  endpoint: config.storage.s3.endpoint,
  forcePathStyle: true,
});

/**
 * Generate a signed URL for a private R2/S3 object
 * @param {string} key - File key in the bucket
 * @param {number} expiresIn - Expiration time in seconds (default 1 hour)
 * @returns {Promise<string>}
 */
const getSignedFileUrl = async (key, expiresIn = 3600) => {
  if (!key) return null;
  
  // If storage mode is local, return the local URL
  if (config.storage.mode === 'local') {
    return `${process.env.BASE_URL || 'http://localhost:3000'}/${key}`;
  }

  const command = new GetObjectCommand({
    Bucket: config.storage.s3.bucket,
    Key: key,
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
};

module.exports = {
  getSignedFileUrl,
};
