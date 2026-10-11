const { Sequelize } = require('sequelize');

const createSequelizeInstance = () => {
  const options = {
    dialect: 'postgres',
    logging: false
  };

  if (process.env.DB_SSL === 'true') {
    options.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    };
  }

  if (process.env.DATABASE_URL) {
    return new Sequelize(process.env.DATABASE_URL, options);
  }

  return new Sequelize(
    process.env.DB_NAME || 'opd_mini',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || '',
    {
      ...options,
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 5432)
    }
  );
};

const sequelize = createSequelizeInstance();

const connectDB = async () => {
  await sequelize.authenticate();
  console.log('PostgreSQL connected successfully');

  // Demo setup. Use versioned migrations instead of sync() in production.
  await sequelize.sync();
  console.log('PostgreSQL tables are ready');
};

module.exports = { sequelize, connectDB };
