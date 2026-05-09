const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Analysis', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false },
    resumeId: { type: DataTypes.UUID, allowNull: true },
    targetRole: { type: DataTypes.STRING(200), allowNull: false },
    company: { type: DataTypes.STRING(200), allowNull: true },
    jobDescription: { type: DataTypes.TEXT, allowNull: false },
    overallScore: { type: DataTypes.INTEGER, allowNull: true },
    atsScore: { type: DataTypes.INTEGER, allowNull: true },
    keywordMatch: { type: DataTypes.INTEGER, allowNull: true },
    experienceMatch: { type: DataTypes.INTEGER, allowNull: true },
    interviewReadiness: { type: DataTypes.INTEGER, allowNull: true },
    strengths: { type: DataTypes.JSONB, defaultValue: [] },
    weaknesses: { type: DataTypes.JSONB, defaultValue: [] },
    matchedSkills: { type: DataTypes.JSONB, defaultValue: [] },
    missingSkills: { type: DataTypes.JSONB, defaultValue: [] },
    partialSkills: { type: DataTypes.JSONB, defaultValue: [] },
    suggestions: { type: DataTypes.JSONB, defaultValue: [] },
    roleMatches: { type: DataTypes.JSONB, defaultValue: [] },
    summary: { type: DataTypes.TEXT, allowNull: true },
    rawResponse: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
    },
    errorMessage: { type: DataTypes.TEXT, allowNull: true },
  }, { tableName: 'analyses', timestamps: true });
};