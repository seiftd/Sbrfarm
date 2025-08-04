module.exports = (sequelize, DataTypes) => {
  const SeasonalEvent = sequelize.define('SeasonalEvent', {
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
    eventType: {
      type: DataTypes.ENUM('seasonal', 'holiday', 'special', 'community', 'pvp', 'limited'),
      allowNull: false
    },
    season: {
      type: DataTypes.ENUM('spring', 'summer', 'autumn', 'winter', 'any'),
      defaultValue: 'any'
    },
    // Event timing
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    recurringPattern: {
      type: DataTypes.ENUM('yearly', 'monthly', 'weekly', 'daily'),
      allowNull: true
    },
    // Event mechanics
    eventGoals: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    globalProgress: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    participantCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Bonuses and effects
    cropBonuses: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    globalBonuses: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    specialCrops: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    weatherEffects: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    // Rewards
    participationRewards: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    milestoneRewards: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    leaderboardRewards: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    exclusiveItems: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    // Visual and audio
    themeColors: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    backgroundMusic: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    specialEffects: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    // Status
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'seasonal_events',
    timestamps: true
  });

  // Static methods for creating seasonal events
  SeasonalEvent.createSpringEvent = function() {
    return {
      name: 'Spring Awakening',
      description: 'Nature awakens! All crops grow 25% faster and water is abundant.',
      eventType: 'seasonal',
      season: 'spring',
      cropBonuses: {
        all: { growthSpeed: 1.25, waterEfficiency: 1.3 }
      },
      globalBonuses: {
        dailyWater: 20,
        seedDropRate: 1.5
      },
      specialCrops: ['spring_flower', 'fresh_herbs'],
      weatherEffects: {
        rain: { chance: 0.3, bonus: 'extra_water' },
        sunshine: { chance: 0.7, bonus: 'growth_boost' }
      },
      participationRewards: {
        sbr_coin: 100,
        spring_seeds: 3
      }
    };
  };

  SeasonalEvent.createSummerEvent = function() {
    return {
      name: 'Summer Harvest Festival',
      description: 'The sun shines bright! Harvest yields are increased and new exotic crops appear.',
      eventType: 'seasonal',
      season: 'summer',
      cropBonuses: {
        all: { yieldMultiplier: 1.4, valueBonus: 1.2 }
      },
      globalBonuses: {
        harvestBonus: 1.5,
        experienceBonus: 1.3
      },
      specialCrops: ['summer_fruits', 'exotic_vegetables'],
      weatherEffects: {
        heatwave: { chance: 0.2, effect: 'double_yield' },
        perfect_weather: { chance: 0.6, bonus: 'quality_boost' }
      }
    };
  };

  SeasonalEvent.createAutumnEvent = function() {
    return {
      name: 'Autumn Abundance',
      description: 'Harvest season is here! Crops are worth more and special autumn varieties appear.',
      eventType: 'seasonal',
      season: 'autumn',
      cropBonuses: {
        all: { valueMultiplier: 1.5, preservationBonus: 1.2 }
      },
      globalBonuses: {
        marketBonus: 1.3,
        tradingFeeReduction: 0.5
      },
      specialCrops: ['pumpkins', 'autumn_wheat', 'golden_corn'],
      weatherEffects: {
        harvest_moon: { chance: 0.1, effect: 'mega_bonus' }
      }
    };
  };

  SeasonalEvent.createWinterEvent = function() {
    return {
      name: 'Winter Wonderland',
      description: 'Winter brings challenges and rewards! Preserve your crops and discover winter varieties.',
      eventType: 'seasonal',
      season: 'winter',
      cropBonuses: {
        winter_crops: { growthSpeed: 1.1, coldResistance: true }
      },
      globalBonuses: {
        preservationBonus: 2.0,
        coopBonus: 1.4
      },
      specialCrops: ['winter_berries', 'ice_flowers', 'frost_vegetables'],
      weatherEffects: {
        blizzard: { chance: 0.1, effect: 'preservation_bonus' },
        snow: { chance: 0.4, bonus: 'slower_decay' }
      }
    };
  };

  SeasonalEvent.createHolidayEvent = function(holiday) {
    const holidayEvents = {
      halloween: {
        name: 'Spooky Harvest',
        description: 'Grow spooky crops and earn Halloween rewards!',
        specialCrops: ['pumpkins', 'ghost_peppers', 'witch_herbs'],
        themeColors: { primary: '#FF6B35', secondary: '#2D1B14' }
      },
      christmas: {
        name: 'Christmas Farm',
        description: 'Spread Christmas cheer with festive farming!',
        specialCrops: ['christmas_trees', 'candy_canes', 'festive_flowers'],
        themeColors: { primary: '#C41E3A', secondary: '#228B22' }
      },
      easter: {
        name: 'Easter Garden',
        description: 'Find hidden eggs and grow spring delights!',
        specialCrops: ['easter_lilies', 'colorful_carrots', 'spring_herbs'],
        themeColors: { primary: '#FFB6C1', secondary: '#98FB98' }
      }
    };

    return holidayEvents[holiday] || {};
  };

  // Instance methods
  SeasonalEvent.prototype.isCurrentlyActive = function() {
    const now = new Date();
    return this.isActive && 
           now >= this.startDate && 
           now <= this.endDate;
  };

  SeasonalEvent.prototype.getTimeRemaining = function() {
    const now = new Date();
    const endTime = new Date(this.endDate);
    const remaining = endTime.getTime() - now.getTime();

    if (remaining <= 0) {
      return { expired: true };
    }

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, expired: false };
  };

  SeasonalEvent.prototype.addParticipant = function() {
    this.participantCount += 1;
  };

  SeasonalEvent.prototype.updateGlobalProgress = function(progressType, amount) {
    if (!this.globalProgress) {
      this.globalProgress = {};
    }
    
    if (!this.globalProgress[progressType]) {
      this.globalProgress[progressType] = 0;
    }
    
    this.globalProgress[progressType] += amount;
    
    // Check for milestone completions
    return this.checkMilestones();
  };

  SeasonalEvent.prototype.checkMilestones = function() {
    const completedMilestones = [];
    
    this.milestoneRewards.forEach((milestone, index) => {
      const progressType = milestone.progressType;
      const required = milestone.required;
      const current = this.globalProgress[progressType] || 0;
      
      if (current >= required && !milestone.completed) {
        milestone.completed = true;
        milestone.completedAt = new Date();
        completedMilestones.push(milestone);
      }
    });
    
    return completedMilestones;
  };

  SeasonalEvent.prototype.getCropBonus = function(cropType) {
    const bonuses = this.cropBonuses || {};
    
    // Check for specific crop bonuses
    if (bonuses[cropType]) {
      return bonuses[cropType];
    }
    
    // Check for category bonuses
    const categories = this.getCropCategories(cropType);
    for (const category of categories) {
      if (bonuses[category]) {
        return bonuses[category];
      }
    }
    
    // Check for 'all' bonus
    if (bonuses.all) {
      return bonuses.all;
    }
    
    return {};
  };

  SeasonalEvent.prototype.getCropCategories = function(cropType) {
    const categories = {
      potato: ['vegetables', 'root_crops'],
      tomato: ['vegetables', 'fruits'],
      onion: ['vegetables', 'aromatic'],
      carrot: ['vegetables', 'root_crops'],
      wheat: ['grains', 'staples'],
      corn: ['grains', 'sweet']
    };
    
    return categories[cropType] || [];
  };

  SeasonalEvent.prototype.getLeaderboard = async function(limit = 10) {
    // This would typically query user event participation
    // For now, return a placeholder structure
    return {
      topHarvesters: [],
      topTraders: [],
      topContributors: []
    };
  };

  SeasonalEvent.prototype.generateEventNFT = function() {
    const rarityChances = {
      common: 0.6,
      uncommon: 0.25,
      rare: 0.1,
      epic: 0.04,
      legendary: 0.01
    };
    
    const random = Math.random();
    let cumulativeChance = 0;
    
    for (const [rarity, chance] of Object.entries(rarityChances)) {
      cumulativeChance += chance;
      if (random <= cumulativeChance) {
        return {
          rarity,
          eventId: this.id,
          eventName: this.name,
          specialTraits: this.getEventTraits(rarity)
        };
      }
    }
    
    return null;
  };

  SeasonalEvent.prototype.getEventTraits = function(rarity) {
    const seasonalTraits = {
      spring: ['Blooming', 'Fresh', 'Vibrant'],
      summer: ['Radiant', 'Warm', 'Abundant'],
      autumn: ['Golden', 'Harvest', 'Rich'],
      winter: ['Crystalline', 'Pure', 'Enduring']
    };
    
    const traits = seasonalTraits[this.season] || ['Unique', 'Special', 'Limited'];
    
    if (rarity === 'legendary' || rarity === 'epic') {
      traits.push('Mythical', 'Transcendent');
    }
    
    return traits;
  };

  return SeasonalEvent;
};