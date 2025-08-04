module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    telegramId: {
      type: DataTypes.BIGINT,
      unique: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    firstName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    // Wallet & Currency
    sbrCoin: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    usdtBalance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    tonBalance: {
      type: DataTypes.DECIMAL(10, 8),
      defaultValue: 0.00000000
    },
    // Inventory
    waterDrops: {
      type: DataTypes.INTEGER,
      defaultValue: 10 // Starting water
    },
    heavyWaterDrops: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    boosters: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Seeds inventory
    potatoSeeds: {
      type: DataTypes.INTEGER,
      defaultValue: 1 // Starting with 1 potato seed
    },
    tomatoSeeds: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    onionSeeds: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    carrotSeeds: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Patch parts for expansion
    patchParts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Game Statistics
    totalPatchesOwned: {
      type: DataTypes.INTEGER,
      defaultValue: 3 // Starting patches
    },
    totalCropsHarvested: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalAdsWatched: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalReferrals: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Daily tracking
    lastDailyWater: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastAdWatch: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // VIP Status
    isVip: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    vipTier: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    vipExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Account Status
    isBanned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    banReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Referral Code
    referralCode: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: true
    },
    referredBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    // Language & Settings
    language: {
      type: DataTypes.STRING(10),
      defaultValue: 'en'
    },
    soundEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    notificationsEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // Timestamps
    lastActive: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    registeredAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: (user) => {
        // Generate unique referral code
        user.referralCode = generateReferralCode(user.telegramId);
      }
    }
  });

  // Generate referral code based on telegram ID
  function generateReferralCode(telegramId) {
    const base = telegramId.toString();
    const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `SBR${base.slice(-4)}${suffix}`;
  }

  // Instance methods
  User.prototype.canWatchAd = function() {
    if (!this.lastAdWatch) return true;
    const oneMinuteAgo = new Date(Date.now() - 60000);
    return this.lastAdWatch < oneMinuteAgo;
  };

  User.prototype.canClaimDailyWater = function() {
    if (!this.lastDailyWater) return true;
    const today = new Date();
    const lastClaim = new Date(this.lastDailyWater);
    return today.toDateString() !== lastClaim.toDateString();
  };

  User.prototype.hasVipBenefits = function() {
    return this.isVip && this.vipExpiresAt && new Date() < this.vipExpiresAt;
  };

  User.prototype.getMaxPatches = function() {
    let basePatches = 3;
    if (this.hasVipBenefits()) {
      switch (this.vipTier) {
        case 1: basePatches += 1; break;
        case 2: basePatches += 1; break;
        case 3: basePatches += 2; break;
        case 4: basePatches += 3; break;
      }
    }
    return Math.min(basePatches + Math.floor(this.patchParts / 10), 8);
  };

  User.prototype.addWater = function(amount) {
    const maxWater = process.env.MAX_WATER_DROPS || 100;
    this.waterDrops = Math.min(this.waterDrops + amount, maxWater);
  };

  User.prototype.convertWaterToHeavy = function(amount) {
    const waterNeeded = amount * 100;
    if (this.waterDrops >= waterNeeded) {
      this.waterDrops -= waterNeeded;
      this.heavyWaterDrops = Math.min(this.heavyWaterDrops + amount, 5);
      return true;
    }
    return false;
  };

  User.prototype.convertSbrToUsdt = function(sbrAmount) {
    const conversionRate = parseInt(process.env.CONVERSION_RATE_SBR_TO_USDT) || 200;
    if (this.sbrCoin >= sbrAmount) {
      const usdtAmount = sbrAmount / conversionRate;
      this.sbrCoin -= sbrAmount;
      this.usdtBalance = parseFloat(this.usdtBalance) + usdtAmount;
      return true;
    }
    return false;
  };

  return User;
};