module.exports = (sequelize, DataTypes) => {
  const Crop = sequelize.define('Crop', {
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
    patchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'patches',
        key: 'id'
      }
    },
    cropType: {
      type: DataTypes.ENUM('potato', 'tomato', 'onion', 'carrot'),
      allowNull: false
    },
    plantedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    harvestAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isHarvested: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    harvestedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Growth tracking
    growthStage: {
      type: DataTypes.INTEGER,
      defaultValue: 1 // 1-4 (seed, sprout, growing, mature)
    },
    growthPercentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0 // 0-100%
    },
    baseGrowthTime: {
      type: DataTypes.INTEGER,
      allowNull: false // Base growth time in hours
    },
    actualGrowthTime: {
      type: DataTypes.INTEGER,
      allowNull: false // Actual growth time after bonuses/boosters
    },
    boostersUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Water requirements
    waterRequired: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    waterUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isWatered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Disease & health
    hasDisease: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    diseaseType: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    healthPercentage: {
      type: DataTypes.INTEGER,
      defaultValue: 100
    },
    // Yield
    expectedYield: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    actualYield: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    qualityGrade: {
      type: DataTypes.ENUM('poor', 'normal', 'good', 'excellent'),
      defaultValue: 'normal'
    }
  }, {
    tableName: 'crops',
    timestamps: true,
    hooks: {
      beforeCreate: (crop) => {
        const cropData = getCropData(crop.cropType);
        crop.baseGrowthTime = cropData.growthTime;
        crop.actualGrowthTime = cropData.growthTime;
        crop.waterRequired = cropData.waterRequired;
        crop.expectedYield = cropData.baseYield;
        
        // Set harvest time
        const harvestTime = new Date();
        harvestTime.setHours(harvestTime.getHours() + crop.actualGrowthTime);
        crop.harvestAt = harvestTime;
      }
    }
  });

  // Crop data configuration
  function getCropData(cropType) {
    const crops = {
      potato: { growthTime: 24, waterRequired: 10, baseYield: 1, sbrValue: 100 },
      tomato: { growthTime: 48, waterRequired: 20, baseYield: 1, sbrValue: 150 },
      onion: { growthTime: 96, waterRequired: 50, baseYield: 1, sbrValue: 250 },
      carrot: { growthTime: 144, waterRequired: 100, baseYield: 1, sbrValue: 1300 }
    };
    return crops[cropType];
  }

  // Instance methods
  Crop.prototype.isReady = function() {
    return new Date() >= this.harvestAt && !this.isHarvested;
  };

  Crop.prototype.canUseBooster = function() {
    const maxBoosters = {
      potato: 12,
      tomato: 20,
      onion: 40,
      carrot: 60
    };
    return this.boostersUsed < (maxBoosters[this.cropType] / 2);
  };

  Crop.prototype.useBooster = function() {
    if (!this.canUseBooster() || this.isHarvested) return false;
    
    // Reduce harvest time by 2 hours
    const newHarvestTime = new Date(this.harvestAt);
    newHarvestTime.setHours(newHarvestTime.getHours() - 2);
    
    // Don't allow harvest time to be in the past beyond current time
    const now = new Date();
    if (newHarvestTime < now) {
      this.harvestAt = now;
    } else {
      this.harvestAt = newHarvestTime;
    }
    
    this.boostersUsed += 1;
    this.actualGrowthTime = Math.max(this.actualGrowthTime - 2, 1);
    return true;
  };

  Crop.prototype.water = function() {
    if (this.isWatered || this.waterUsed >= this.waterRequired) return false;
    
    this.waterUsed = this.waterRequired;
    this.isWatered = true;
    return true;
  };

  Crop.prototype.getGrowthPercentage = function() {
    const now = new Date();
    const planted = new Date(this.plantedAt);
    const harvest = new Date(this.harvestAt);
    
    const totalTime = harvest.getTime() - planted.getTime();
    const elapsed = now.getTime() - planted.getTime();
    
    const percentage = Math.min(Math.max((elapsed / totalTime) * 100, 0), 100);
    return Math.round(percentage);
  };

  Crop.prototype.getGrowthStage = function() {
    const percentage = this.getGrowthPercentage();
    if (percentage < 25) return 1; // Seed
    if (percentage < 50) return 2; // Sprout
    if (percentage < 75) return 3; // Growing
    return 4; // Mature
  };

  Crop.prototype.calculateYield = function() {
    let yield = this.expectedYield;
    
    // Water bonus
    if (this.isWatered) yield += 0.5;
    
    // Health impact
    yield *= (this.healthPercentage / 100);
    
    // Quality bonus
    switch (this.qualityGrade) {
      case 'excellent': yield *= 1.5; break;
      case 'good': yield *= 1.25; break;
      case 'poor': yield *= 0.75; break;
    }
    
    return Math.max(Math.round(yield), 1);
  };

  Crop.prototype.harvest = function() {
    if (!this.isReady() || this.isHarvested) return null;
    
    this.actualYield = this.calculateYield();
    this.isHarvested = true;
    this.harvestedAt = new Date();
    
    const cropData = getCropData(this.cropType);
    const sbrEarned = this.actualYield * cropData.sbrValue;
    
    return {
      cropType: this.cropType,
      yield: this.actualYield,
      sbrEarned: sbrEarned,
      quality: this.qualityGrade
    };
  };

  Crop.prototype.getTimeRemaining = function() {
    if (this.isHarvested) return 0;
    
    const now = new Date();
    const harvest = new Date(this.harvestAt);
    const remaining = harvest.getTime() - now.getTime();
    
    return Math.max(remaining, 0);
  };

  return Crop;
};