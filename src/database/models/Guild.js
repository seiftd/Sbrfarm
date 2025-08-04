module.exports = (sequelize, DataTypes) => {
  const Guild = sequelize.define('Guild', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tag: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true
    },
    leaderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Guild settings
    maxMembers: {
      type: DataTypes.INTEGER,
      defaultValue: 50
    },
    currentMembers: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    guildType: {
      type: DataTypes.ENUM('casual', 'competitive', 'trading', 'educational', 'elite'),
      defaultValue: 'casual'
    },
    joinRequirement: {
      type: DataTypes.ENUM('open', 'invite_only', 'application', 'level_requirement'),
      defaultValue: 'open'
    },
    minimumLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    // Guild resources
    guildTreasury: {
      type: DataTypes.INTEGER,
      defaultValue: 0 // SBR coins
    },
    guildExp: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    guildLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    // Guild perks and bonuses
    activePerks: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    unlockedPerks: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    // Competition and achievements
    guildRank: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalVictories: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalDefeats: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    currentStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    bestStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Guild statistics
    totalHarvests: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalValue: {
      type: DataTypes.DECIMAL(18, 8),
      defaultValue: 0
    },
    weeklyContribution: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    monthlyContribution: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Guild features
    hasGuildHall: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hasGuildFarm: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hasGuildShop: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    guildBonuses: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    // Communication
    guildMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    announcement: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    announcementDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Status
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isRecruiting: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastActivity: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'guilds',
    timestamps: true,
    hooks: {
      beforeCreate: (guild) => {
        // Ensure tag is uppercase
        guild.tag = guild.tag.toUpperCase();
      }
    }
  });

  // Static methods
  Guild.getGuildPerks = function(level) {
    const perks = {
      1: ['member_bonus_5', 'daily_water_10'],
      2: ['member_bonus_10', 'harvest_bonus_5'],
      3: ['guild_farm_access', 'trade_discount_5'],
      4: ['member_bonus_15', 'growth_speed_5'],
      5: ['guild_shop_access', 'contest_entry_discount'],
      10: ['member_bonus_25', 'legendary_crop_chance'],
      15: ['guild_hall_access', 'pvp_bonus_10'],
      20: ['member_bonus_50', 'nft_breeding_bonus']
    };

    const availablePerks = [];
    for (let i = 1; i <= level; i++) {
      if (perks[i]) {
        availablePerks.push(...perks[i]);
      }
    }
    return availablePerks;
  };

  // Instance methods
  Guild.prototype.canJoin = function(user) {
    if (!this.isActive || !this.isRecruiting) {
      return { can: false, reason: 'Guild not accepting members' };
    }

    if (this.currentMembers >= this.maxMembers) {
      return { can: false, reason: 'Guild is full' };
    }

    if (this.joinRequirement === 'level_requirement' && user.level < this.minimumLevel) {
      return { can: false, reason: `Requires level ${this.minimumLevel}` };
    }

    return { can: true };
  };

  Guild.prototype.addMember = function() {
    if (this.currentMembers < this.maxMembers) {
      this.currentMembers += 1;
      this.lastActivity = new Date();
      return true;
    }
    return false;
  };

  Guild.prototype.removeMember = function() {
    if (this.currentMembers > 1) {
      this.currentMembers -= 1;
      return true;
    }
    return false;
  };

  Guild.prototype.addToTreasury = function(amount) {
    this.guildTreasury += amount;
    this.guildExp += Math.floor(amount / 10);
    this.lastActivity = new Date();
    
    // Check for level up
    return this.checkLevelUp();
  };

  Guild.prototype.checkLevelUp = function() {
    const expRequired = this.guildLevel * 5000;
    if (this.guildExp >= expRequired) {
      this.guildLevel += 1;
      this.guildExp -= expRequired;
      this.maxMembers += 5; // Increase capacity
      
      // Unlock new perks
      const newPerks = Guild.getGuildPerks(this.guildLevel);
      this.unlockedPerks = [...new Set([...this.unlockedPerks, ...newPerks])];
      
      return true;
    }
    return false;
  };

  Guild.prototype.activatePerk = function(perkName, cost = 0) {
    if (!this.unlockedPerks.includes(perkName)) {
      return { success: false, reason: 'Perk not unlocked' };
    }

    if (cost > 0 && this.guildTreasury < cost) {
      return { success: false, reason: 'Insufficient treasury funds' };
    }

    if (!this.activePerks.includes(perkName)) {
      this.activePerks.push(perkName);
      this.guildTreasury -= cost;
      return { success: true };
    }

    return { success: false, reason: 'Perk already active' };
  };

  Guild.prototype.getGuildBonuses = function() {
    const bonuses = {
      memberBonus: 0,
      harvestBonus: 0,
      growthSpeed: 0,
      tradeDiscount: 0,
      pvpBonus: 0
    };

    this.activePerks.forEach(perk => {
      switch (perk) {
        case 'member_bonus_5': bonuses.memberBonus += 5; break;
        case 'member_bonus_10': bonuses.memberBonus += 10; break;
        case 'member_bonus_15': bonuses.memberBonus += 15; break;
        case 'member_bonus_25': bonuses.memberBonus += 25; break;
        case 'member_bonus_50': bonuses.memberBonus += 50; break;
        case 'harvest_bonus_5': bonuses.harvestBonus += 5; break;
        case 'growth_speed_5': bonuses.growthSpeed += 5; break;
        case 'trade_discount_5': bonuses.tradeDiscount += 5; break;
        case 'pvp_bonus_10': bonuses.pvpBonus += 10; break;
      }
    });

    return bonuses;
  };

  Guild.prototype.declareWar = function(targetGuildId) {
    // Start a guild war
    return {
      warId: Date.now(),
      attacker: this.id,
      defender: targetGuildId,
      startTime: new Date(),
      duration: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
  };

  Guild.prototype.recordVictory = function() {
    this.totalVictories += 1;
    this.currentStreak += 1;
    if (this.currentStreak > this.bestStreak) {
      this.bestStreak = this.currentStreak;
    }
    
    // Victory rewards
    const reward = Math.floor(this.guildLevel * 100);
    this.addToTreasury(reward);
  };

  Guild.prototype.recordDefeat = function() {
    this.totalDefeats += 1;
    this.currentStreak = 0;
  };

  Guild.prototype.getRank = function() {
    const totalBattles = this.totalVictories + this.totalDefeats;
    if (totalBattles === 0) return 'Unranked';
    
    const winRate = (this.totalVictories / totalBattles) * 100;
    
    if (winRate >= 90) return 'Legendary';
    if (winRate >= 80) return 'Diamond';
    if (winRate >= 70) return 'Platinum';
    if (winRate >= 60) return 'Gold';
    if (winRate >= 50) return 'Silver';
    return 'Bronze';
  };

  Guild.prototype.setAnnouncement = function(message) {
    this.announcement = message;
    this.announcementDate = new Date();
  };

  Guild.prototype.getWeeklyGoal = function() {
    const baseGoal = this.guildLevel * 1000;
    return {
      target: baseGoal,
      current: this.weeklyContribution,
      reward: baseGoal * 0.1,
      completed: this.weeklyContribution >= baseGoal
    };
  };

  return Guild;
};