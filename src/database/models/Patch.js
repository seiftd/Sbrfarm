module.exports = (sequelize, DataTypes) => {
  const Patch = sequelize.define('Patch', {
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
    patchNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    soilQuality: {
      type: DataTypes.ENUM('poor', 'normal', 'good', 'excellent'),
      defaultValue: 'normal'
    },
    isWatered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastWatered: {
      type: DataTypes.DATE,
      allowNull: true
    },
    waterLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 0 // Current water level
    },
    fertilized: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Patch upgrades
    hasSprinkler: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hasGreenhouse: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Statistics
    totalCropsGrown: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalHarvests: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'patches',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'patchNumber']
      }
    ]
  });

  // Instance methods
  Patch.prototype.needsWater = function() {
    return this.waterLevel < 10 || !this.isWatered;
  };

  Patch.prototype.canPlant = function() {
    return this.isActive && !this.getCurrentCrop();
  };

  Patch.prototype.getCurrentCrop = function() {
    // This will be populated through associations
    return this.crops && this.crops.find(crop => !crop.isHarvested);
  };

  Patch.prototype.water = function(amount = 10) {
    this.waterLevel = Math.min(this.waterLevel + amount, 100);
    this.isWatered = true;
    this.lastWatered = new Date();
  };

  Patch.prototype.getGrowthBonus = function() {
    let bonus = 1.0;
    
    if (this.hasSprinkler) bonus += 0.1;
    if (this.hasGreenhouse) bonus += 0.2;
    if (this.fertilized) bonus += 0.15;
    
    switch (this.soilQuality) {
      case 'excellent': bonus += 0.25; break;
      case 'good': bonus += 0.15; break;
      case 'poor': bonus -= 0.1; break;
    }
    
    return bonus;
  };

  return Patch;
};