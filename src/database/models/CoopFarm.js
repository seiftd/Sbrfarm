module.exports = (sequelize, DataTypes) => {
  const CoopFarm = sequelize.define('CoopFarm', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    farmCode: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false
    },
    maxMembers: {
      type: DataTypes.INTEGER,
      defaultValue: 10
    },
    currentMembers: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    // Farm settings
    farmSize: {
      type: DataTypes.INTEGER,
      defaultValue: 25 // Total patches
    },
    farmType: {
      type: DataTypes.ENUM('community', 'competitive', 'educational', 'private'),
      defaultValue: 'community'
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard', 'expert'),
      defaultValue: 'medium'
    },
    // Sharing settings
    shareMode: {
      type: DataTypes.ENUM('equal', 'contribution', 'ownership'),
      defaultValue: 'contribution'
    },
    allowVisitors: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    publicJoin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Farm resources
    sharedWater: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    sharedBoosters: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    farmTreasury: {
      type: DataTypes.INTEGER,
      defaultValue: 0 // SBR coins
    },
    // Goals and achievements
    farmGoals: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    completedGoals: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    farmLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    farmExp: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Statistics
    totalHarvests: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalValue: {
      type: DataTypes.DECIMAL(18, 8),
      defaultValue: 0
    },
    averageActivity: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    // Events and seasons
    currentSeason: {
      type: DataTypes.ENUM('spring', 'summer', 'autumn', 'winter'),
      defaultValue: 'spring'
    },
    seasonStartDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    activeEvents: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    // Status
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isPrivate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastActivity: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'coop_farms',
    timestamps: true,
    hooks: {
      beforeCreate: (farm) => {
        // Generate unique farm code
        farm.farmCode = generateFarmCode();
      }
    }
  });

  function generateFarmCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'FARM';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Instance methods
  CoopFarm.prototype.canJoin = function() {
    return this.isActive && this.currentMembers < this.maxMembers;
  };

  CoopFarm.prototype.addMember = function() {
    if (this.canJoin()) {
      this.currentMembers += 1;
      return true;
    }
    return false;
  };

  CoopFarm.prototype.removeMember = function() {
    if (this.currentMembers > 1) {
      this.currentMembers -= 1;
      return true;
    }
    return false;
  };

  CoopFarm.prototype.calculateSharedReward = function(totalReward, userId) {
    // Calculate reward based on share mode
    switch (this.shareMode) {
      case 'equal':
        return Math.floor(totalReward / this.currentMembers);
      case 'contribution':
        // Would need contribution tracking
        return Math.floor(totalReward * 0.1); // Placeholder
      case 'ownership':
        // Owner gets larger share
        return Math.floor(totalReward * 0.5); // Placeholder
      default:
        return Math.floor(totalReward / this.currentMembers);
    }
  };

  CoopFarm.prototype.addToTreasury = function(amount) {
    this.farmTreasury += amount;
    this.lastActivity = new Date();
  };

  CoopFarm.prototype.spendFromTreasury = function(amount) {
    if (this.farmTreasury >= amount) {
      this.farmTreasury -= amount;
      return true;
    }
    return false;
  };

  CoopFarm.prototype.levelUp = function() {
    const expRequired = this.farmLevel * 1000;
    if (this.farmExp >= expRequired) {
      this.farmLevel += 1;
      this.farmExp -= expRequired;
      this.maxMembers += 2; // Increase capacity
      return true;
    }
    return false;
  };

  CoopFarm.prototype.startSeason = function(season) {
    this.currentSeason = season;
    this.seasonStartDate = new Date();
    
    // Reset seasonal bonuses
    const seasonalBonuses = {
      spring: { water: 100, boosters: 5 },
      summer: { water: 50, growth: 1.2 },
      autumn: { harvest: 1.5, value: 1.3 },
      winter: { preservation: true, bonus_time: 24 }
    };
    
    return seasonalBonuses[season] || {};
  };

  CoopFarm.prototype.addEvent = function(eventData) {
    if (!Array.isArray(this.activeEvents)) {
      this.activeEvents = [];
    }
    this.activeEvents.push({
      ...eventData,
      startTime: new Date(),
      id: Date.now()
    });
  };

  CoopFarm.prototype.getActiveBonuses = function() {
    const bonuses = {
      growthSpeed: 1.0,
      yieldBonus: 1.0,
      valueBonus: 1.0,
      waterEfficiency: 1.0
    };

    // Farm level bonuses
    bonuses.growthSpeed += (this.farmLevel - 1) * 0.05;
    bonuses.yieldBonus += (this.farmLevel - 1) * 0.03;

    // Seasonal bonuses
    switch (this.currentSeason) {
      case 'spring':
        bonuses.growthSpeed += 0.2;
        break;
      case 'summer':
        bonuses.yieldBonus += 0.15;
        break;
      case 'autumn':
        bonuses.valueBonus += 0.3;
        break;
      case 'winter':
        bonuses.waterEfficiency += 0.25;
        break;
    }

    // Member count bonuses
    if (this.currentMembers >= 5) {
      bonuses.growthSpeed += 0.1;
    }
    if (this.currentMembers >= 8) {
      bonuses.yieldBonus += 0.1;
    }

    return bonuses;
  };

  return CoopFarm;
};