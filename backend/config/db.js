const mongoose = require('mongoose');
const logger = require('../utils/logger');

function resolveMongoUri() {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI.replace(/^MONGO_URI=/, '');
  }

  const { MONGO_USER, MONGO_PASSWORD, MONGO_HOST, MONGO_DB } = process.env;
  if (MONGO_USER && MONGO_PASSWORD && MONGO_HOST && MONGO_DB) {
    const encodedUser = encodeURIComponent(MONGO_USER);
    const encodedPass = encodeURIComponent(MONGO_PASSWORD);
    return `mongodb+srv://${encodedUser}:${encodedPass}@${MONGO_HOST}/${MONGO_DB}?retryWrites=true&w=majority`;
  }

  return 'mongodb://127.0.0.1:27017/family_connect';
}

const connectDB = async () => {
  const uri = resolveMongoUri();
  const safeUri = uri.replace(/:([^:@/]+)@/, ':****@');

  try {
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host} (${safeUri})`);

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
module.exports.resolveMongoUri = resolveMongoUri;
