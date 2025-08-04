module.exports = (sequelize, DataTypes) => {
  const VipSubscription = sequelize.define('VipSubscription', {
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
    tier: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 4
      }
    },
    startDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('usdt', 'ton', 'binance_pay'),
      allowNull: false
    },
    amountPaid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    // Daily rewards tracking
    lastDailyReward: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Benefits usage tracking
    patchesAdded: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    dailyRewardsClaimed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'vip_subscriptions',
    timestamps: true
  });

  // Static method to get VIP tier benefits
  VipSubscription.getTierBenefits = function(tier) {
    const benefits = {
      1: {
        price: 7,
        patches: 1,
        dailyRewards: {
          potatoSeeds: 2,
          waterDrops: 0
        }
      },
      2: {
        price: 15,
        patches: 1,
        dailyRewards: {
          potatoSeeds: 2,
          waterDrops: 10,
          patchParts: 5,
          tomatoSeeds: 1 // every 2 days
        }
      },
      3: {
        price: 30,
        patches: 2,
        dailyRewards: {
          potatoSeeds: 2,
          waterDrops: 20,
          onionSeeds: 1 // every 2 days
        }
      },
      4: {
        price: 99,
        patches: 3,
        dailyRewards: {
          potatoSeeds: 2,
          onionSeeds: 2,
          carrotSeeds: 1 // every 3 days
        }
      }
    };
    return benefits[tier] || null;
  };

  // Instance methods
  VipSubscription.prototype.isExpired = function() {
    return new Date() > this.endDate;
  };

  VipSubscription.prototype.canClaimDailyReward = function() {
    if (!this.lastDailyReward) return true;
    const today = new Date();
    const lastClaim = new Date(this.lastDailyReward);
    return today.toDateString() !== lastClaim.toDateString();
  };

  VipSubscription.prototype.getDaysRemaining = function() {
    const now = new Date();
    const end = new Date(this.endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  };

  VipSubscription.prototype.extendSubscription = function(months = 1) {
    const newEndDate = new Date(this.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + months);
    this.endDate = newEndDate;
  };

  VipSubscription.prototype.claimDailyReward = function() {
    if (!this.canClaimDailyReward() || this.isExpired()) return null;

    const benefits = VipSubscription.getTierBenefits(this.tier);
    if (!benefits) return null;

    this.lastDailyReward = new Date();
    this.dailyRewardsClaimed += 1;

    const rewards = { ...benefits.dailyRewards };

    // Special conditions for certain rewards
    if (this.tier >= 2 && this.dailyRewardsClaimed % 2 === 0) {
      // Tomato seeds every 2 days for tier 2+
      rewards.tomatoSeeds = benefits.dailyRewards.tomatoSeeds || 0;
    }

    if (this.tier >= 3 && this.dailyRewardsClaimed % 2 === 0) {
      // Onion seeds every 2 days for tier 3+
      rewards.onionSeeds = benefits.dailyRewards.onionSeeds || 0;
    }

    if (this.tier >= 4 && this.dailyRewardsClaimed % 3 === 0) {
      // Carrot seeds every 3 days for tier 4
      rewards.carrotSeeds = benefits.dailyRewards.carrotSeeds || 0;
    }

    return rewards;
  };

  return VipSubscription;
};