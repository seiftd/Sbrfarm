module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('daily', 'weekly', 'achievement', 'special', 'referral', 'ads', 'social'),
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('farming', 'social', 'economic', 'challenge'),
      defaultValue: 'farming'
    },
    // Requirements
    targetType: {
      type: DataTypes.ENUM('crops_harvested', 'ads_watched', 'referrals', 'login_days', 'sbr_earned', 'water_used', 'custom'),
      allowNull: false
    },
    targetValue: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    // Rewards
    rewardType: {
      type: DataTypes.ENUM('sbr_coin', 'water_drops', 'boosters', 'seeds', 'patch_parts'),
      allowNull: false
    },
    rewardAmount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rewardDescription: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    // Status and timing
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Display
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    isRepeatable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'tasks',
    timestamps: true
  });

  // Static method to create default tasks
  Task.createDefaultTasks = async function() {
    const defaultTasks = [
      // Daily tasks
      {
        title: '🌱 Plant Your First Crop',
        description: 'Plant any crop to get started',
        type: 'daily',
        targetType: 'crops_harvested',
        targetValue: 1,
        rewardType: 'water_drops',
        rewardAmount: 5,
        icon: '🌱'
      },
      {
        title: '📺 Watch 3 Ads',
        description: 'Watch 3 advertisements to earn water',
        type: 'daily',
        targetType: 'ads_watched',
        targetValue: 3,
        rewardType: 'sbr_coin',
        rewardAmount: 10,
        icon: '📺',
        isRepeatable: true
      },
      {
        title: '💧 Use 50 Water Drops',
        description: 'Water your crops with 50 water drops',
        type: 'daily',
        targetType: 'water_used',
        targetValue: 50,
        rewardType: 'boosters',
        rewardAmount: 1,
        icon: '💧',
        isRepeatable: true
      },
      // Weekly tasks
      {
        title: '🥔 Harvest 10 Potatoes',
        description: 'Harvest 10 potato crops this week',
        type: 'weekly',
        targetType: 'crops_harvested',
        targetValue: 10,
        rewardType: 'sbr_coin',
        rewardAmount: 100,
        icon: '🥔'
      },
      {
        title: '👥 Refer 3 Friends',
        description: 'Invite 3 friends to join the game',
        type: 'weekly',
        targetType: 'referrals',
        targetValue: 3,
        rewardType: 'patch_parts',
        rewardAmount: 5,
        icon: '👥'
      },
      // Achievement tasks
      {
        title: '🏆 Master Farmer',
        description: 'Harvest 100 crops total',
        type: 'achievement',
        targetType: 'crops_harvested',
        targetValue: 100,
        rewardType: 'sbr_coin',
        rewardAmount: 500,
        icon: '🏆'
      },
      {
        title: '💰 SBR Collector',
        description: 'Earn 1000 SBR coins',
        type: 'achievement',
        targetType: 'sbr_earned',
        targetValue: 1000,
        rewardType: 'boosters',
        rewardAmount: 5,
        icon: '💰'
      },
      {
        title: '📱 Ad Enthusiast',
        description: 'Watch 100 ads total',
        type: 'achievement',
        targetType: 'ads_watched',
        targetValue: 100,
        rewardType: 'water_drops',
        rewardAmount: 50,
        icon: '📱'
      }
    ];

    for (const taskData of defaultTasks) {
      await Task.findOrCreate({
        where: { title: taskData.title },
        defaults: taskData
      });
    }
  };

  return Task;
};