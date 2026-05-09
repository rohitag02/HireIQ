const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Resume', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false },
    originalName: { type: DataTypes.STRING(255), allowNull: false },
    storedName: { type: DataTypes.STRING(255), allowNull: false },
    filePath: { type: DataTypes.STRING(500), allowNull: false },
    fileSize: { type: DataTypes.INTEGER, allowNull: false },
    mimeType: { type: DataTypes.STRING(100), allowNull: false },
    extractedText: { type: DataTypes.TEXT, allowNull: true },
    version: { type: DataTypes.INTEGER, defaultValue: 1 },
  }, { tableName: 'resumes', timestamps: true });
};