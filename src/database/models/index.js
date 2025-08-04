const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
    timezone: '+00:00',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import all models
const User = require('./User')(sequelize, DataTypes);
const Patch = require('./Patch')(sequelize, DataTypes);
const Crop = require('./Crop')(sequelize, DataTypes);
const VipSubscription = require('./VipSubscription')(sequelize, DataTypes);
const Contest = require('./Contest')(sequelize, DataTypes);
const ContestEntry = require('./ContestEntry')(sequelize, DataTypes);
const Transaction = require('./Transaction')(sequelize, DataTypes);
const Task = require('./Task')(sequelize, DataTypes);
const UserTask = require('./UserTask')(sequelize, DataTypes);
const Referral = require('./Referral')(sequelize, DataTypes);
const AdminUser = require('./AdminUser')(sequelize, DataTypes);
const GameConfig = require('./GameConfig')(sequelize, DataTypes);

// Define associations
User.hasMany(Patch, { foreignKey: 'userId', as: 'patches' });
Patch.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Crop, { foreignKey: 'userId', as: 'crops' });
Crop.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Patch.hasMany(Crop, { foreignKey: 'patchId', as: 'crops' });
Crop.belongsTo(Patch, { foreignKey: 'patchId', as: 'patch' });

User.hasOne(VipSubscription, { foreignKey: 'userId', as: 'vipSubscription' });
VipSubscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Contest.hasMany(ContestEntry, { foreignKey: 'contestId', as: 'entries' });
ContestEntry.belongsTo(Contest, { foreignKey: 'contestId', as: 'contest' });

User.hasMany(ContestEntry, { foreignKey: 'userId', as: 'contestEntries' });
ContestEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(UserTask, { foreignKey: 'userId', as: 'userTasks' });
UserTask.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Task.hasMany(UserTask, { foreignKey: 'taskId', as: 'userTasks' });
UserTask.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

User.hasMany(Referral, { foreignKey: 'referrerId', as: 'referrals' });
Referral.belongsTo(User, { foreignKey: 'referrerId', as: 'referrer' });

User.hasMany(Referral, { foreignKey: 'referredId', as: 'referredBy' });
Referral.belongsTo(User, { foreignKey: 'referredId', as: 'referred' });

const db = {
  sequelize,
  Sequelize,
  User,
  Patch,
  Crop,
  VipSubscription,
  Contest,
  ContestEntry,
  Transaction,
  Task,
  UserTask,
  Referral,
  AdminUser,
  GameConfig
};

module.exports = db;