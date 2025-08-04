module.exports = (sequelize, DataTypes) => {
  const ContestEntry = sequelize.define('ContestEntry', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    contestId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'contests',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    entryDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    isWinner: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    prizeAwarded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    sbrSpent: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    adsWatchedAtEntry: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'contest_entries',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['contestId', 'userId']
      }
    ]
  });

  return ContestEntry;
};