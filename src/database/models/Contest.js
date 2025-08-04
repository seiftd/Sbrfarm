module.exports = (sequelize, DataTypes) => {
  const Contest = sequelize.define('Contest', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    // Entry requirements
    entryCostSbr: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    requiredAds: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    // Prizes
    prizeType: {
      type: DataTypes.ENUM('sbr_coin', 'water_drops', 'vip_tier', 'custom'),
      allowNull: false
    },
    prizeAmount: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    prizeDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    winnersCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    // Status
    status: {
      type: DataTypes.ENUM('upcoming', 'active', 'ended', 'cancelled'),
      defaultValue: 'upcoming'
    },
    isAutomatic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // Results
    winnersSelected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    selectionMethod: {
      type: DataTypes.ENUM('random', 'performance', 'manual'),
      defaultValue: 'random'
    }
  }, {
    tableName: 'contests',
    timestamps: true
  });

  // Static methods for contest creation
  Contest.createDailyContest = async function() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 30, 0, 0);

    return await Contest.create({
      type: 'daily',
      title: 'Daily Farming Contest',
      description: 'Win random SBR coins and water drops!',
      startDate: new Date(),
      endDate: tomorrow,
      entryCostSbr: 20,
      requiredAds: 5,
      prizeType: 'sbr_coin',
      prizeAmount: Math.floor(Math.random() * 500) + 100, // 100-600 SBR
      winnersCount: Math.floor(Math.random() * 5) + 1, // 1-5 winners
      status: 'active'
    });
  };

  Contest.createWeeklyContest = async function() {
    const nextMonday = new Date();
    const daysUntilMonday = (1 + 7 - nextMonday.getDay()) % 7;
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
    nextMonday.setHours(23, 30, 0, 0);

    return await Contest.create({
      type: 'weekly',
      title: 'Weekly Harvest Challenge',
      description: 'Bigger prizes for dedicated farmers!',
      startDate: new Date(),
      endDate: nextMonday,
      entryCostSbr: 100,
      requiredAds: 30,
      prizeType: 'sbr_coin',
      prizeAmount: Math.floor(Math.random() * 2000) + 500, // 500-2500 SBR
      winnersCount: Math.floor(Math.random() * 10) + 3, // 3-12 winners
      status: 'active'
    });
  };

  Contest.createMonthlyContest = async function() {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1, 0); // Last day of current month
    nextMonth.setHours(23, 30, 0, 0);

    return await Contest.create({
      type: 'monthly',
      title: 'Monthly VIP Giveaway',
      description: 'Win VIP Tier 1 subscription for 1 month!',
      startDate: new Date(),
      endDate: nextMonth,
      entryCostSbr: 200,
      requiredAds: 100,
      prizeType: 'vip_tier',
      prizeAmount: 1,
      prizeDescription: 'VIP Tier 1 for 1 month',
      winnersCount: 3,
      status: 'active'
    });
  };

  // Instance methods
  Contest.prototype.isActive = function() {
    const now = new Date();
    return this.status === 'active' && 
           now >= this.startDate && 
           now <= this.endDate;
  };

  Contest.prototype.canJoin = function(user) {
    if (!this.isActive()) return { can: false, reason: 'Contest not active' };
    if (user.sbrCoin < this.entryCostSbr) return { can: false, reason: 'Insufficient SBR coins' };
    if (user.totalAdsWatched < this.requiredAds) return { can: false, reason: 'Not enough ads watched' };
    
    return { can: true };
  };

  Contest.prototype.getEntryCount = async function() {
    return await this.countEntries();
  };

  Contest.prototype.selectWinners = async function() {
    if (this.winnersSelected) return [];

    const entries = await this.getEntries({
      include: ['user'],
      order: [['createdAt', 'ASC']]
    });

    if (entries.length === 0) return [];

    let winners = [];
    
    if (this.selectionMethod === 'random') {
      // Random selection
      const shuffled = entries.sort(() => 0.5 - Math.random());
      winners = shuffled.slice(0, Math.min(this.winnersCount, entries.length));
    } else if (this.selectionMethod === 'performance') {
      // Select based on user performance metrics
      winners = entries
        .sort((a, b) => {
          const scoreA = a.user.totalCropsHarvested * 10 + a.user.totalAdsWatched;
          const scoreB = b.user.totalCropsHarvested * 10 + b.user.totalAdsWatched;
          return scoreB - scoreA;
        })
        .slice(0, Math.min(this.winnersCount, entries.length));
    }

    this.winnersSelected = true;
    this.status = 'ended';
    await this.save();

    return winners;
  };

  Contest.prototype.distributePrizes = async function(winners) {
    for (const entry of winners) {
      const user = entry.user;
      
      switch (this.prizeType) {
        case 'sbr_coin':
          user.sbrCoin += this.prizeAmount;
          break;
        case 'water_drops':
          user.addWater(this.prizeAmount);
          break;
        case 'vip_tier':
          // Handle VIP subscription creation
          user.isVip = true;
          user.vipTier = this.prizeAmount;
          const vipEndDate = new Date();
          vipEndDate.setMonth(vipEndDate.getMonth() + 1);
          user.vipExpiresAt = vipEndDate;
          break;
      }
      
      await user.save();
      entry.isWinner = true;
      entry.prizeAwarded = true;
      await entry.save();
    }
  };

  return Contest;
};