const admin = require('firebase-admin');

let firebaseApp = null;

try {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
    : null;

  if (serviceAccount) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('[Firebase] Initialized Successfully');
  } else {
    console.warn('[Firebase] Warning: FIREBASE_SERVICE_ACCOUNT not found in .env');
  }
} catch (error) {
  console.error('[Firebase] Initialization Error:', error.message);
}

module.exports = firebaseApp;
