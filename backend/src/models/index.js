const { Sequelize } = require('sequelize');

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false }
      }
    })
  : new Sequelize(
      process.env.DB_NAME || 'hireiq_db',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASS || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
        dialectOptions: { ssl: false }
      }
    );

const User = require('./User')(sequelize);
const Analysis = require('./Analysis')(sequelize);
const Resume = require('./Resume')(sequelize);

User.hasMany(Analysis, { foreignKey: 'userId', as: 'analyses' });
Analysis.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Resume, { foreignKey: 'userId', as: 'resumes' });
Resume.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Analysis.belongsTo(Resume, { foreignKey: 'resumeId', as: 'resume' });
Resume.hasMany(Analysis, { foreignKey: 'resumeId', as: 'analyses' });

module.exports = { sequelize, User, Analysis, Resume };