const admin = require('firebase-admin');
const logger = require('../utils/logger');

let initialized = false;

const initFirebase = () => {
  if (initialized) return;

  // Skip if Firebase credentials not configured
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_PRIVATE_KEY ||
    !process.env.FIREBASE_CLIENT_EMAIL
  ) {
    logger.warn('Firebase credentials not configured — push notifications disabled');
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    initialized = true;
    logger.info('Firebase Admin initialized');
  } catch (err) {
    logger.error(`Firebase init error: ${err.message}`);
  }
};

const isInitialized = () => initialized;

module.exports = { admin, initFirebase, isInitialized };
