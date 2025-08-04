module.exports = (sequelize, DataTypes) => {
  const UserTask = sequelize.define('UserTask', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tasks',
        key: 'id'
      }
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rewardClaimed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    claimedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'user_tasks',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'taskId']
      }
    ]
  });

  return UserTask;
};