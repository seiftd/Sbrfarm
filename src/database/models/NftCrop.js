module.exports = (sequelize, DataTypes) => {
  const NftCrop = sequelize.define('NftCrop', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tokenId: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    baseCropType: {
      type: DataTypes.ENUM('potato', 'tomato', 'onion', 'carrot', 'wheat', 'corn'),
      allowNull: false
    },
    rarity: {
      type: DataTypes.ENUM('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'),
      allowNull: false
    },
    generation: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    // Visual properties
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    animationUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    traits: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    // Game mechanics
    growthSpeedMultiplier: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 1.00
    },
    yieldMultiplier: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 1.00
    },
    valueMultiplier: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 1.00
    },
    specialEffects: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    // NFT metadata
    contractAddress: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    blockchain: {
      type: DataTypes.ENUM('ethereum', 'polygon', 'binance', 'solana'),
      defaultValue: 'polygon'
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    // Ownership and trading
    currentOwner: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    isListed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    listPrice: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: true
    },
    listCurrency: {
      type: DataTypes.ENUM('sbr_coin', 'usdt', 'ton', 'eth'),
      allowNull: true
    },
    // Breeding and evolution
    parentToken1: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    parentToken2: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    breedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    maxBreeds: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },
    canEvolve: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    evolutionRequirements: {
      type: DataTypes.JSON,
      defaultValue: {}
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
    lastUsed: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Status
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isBanned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'nft_crops',
    timestamps: true,
    indexes: [
      { fields: ['tokenId'] },
      { fields: ['currentOwner'] },
      { fields: ['rarity'] },
      { fields: ['isListed'] }
    ]
  });

  // Static methods for NFT creation
  NftCrop.generateNftCrop = function(baseCropType, rarity = 'common') {
    const rarityMultipliers = {
      common: { growth: 1.0, yield: 1.0, value: 1.0 },
      uncommon: { growth: 1.1, yield: 1.1, value: 1.2 },
      rare: { growth: 1.2, yield: 1.3, value: 1.5 },
      epic: { growth: 1.4, yield: 1.6, value: 2.0 },
      legendary: { growth: 1.8, yield: 2.0, value: 3.0 },
      mythic: { growth: 2.5, yield: 3.0, value: 5.0 }
    };

    const specialEffects = {
      common: [],
      uncommon: ['faster_growth'],
      rare: ['faster_growth', 'bonus_yield'],
      epic: ['faster_growth', 'bonus_yield', 'weather_resistant'],
      legendary: ['faster_growth', 'bonus_yield', 'weather_resistant', 'auto_water'],
      mythic: ['faster_growth', 'bonus_yield', 'weather_resistant', 'auto_water', 'infinite_harvest']
    };

    const multipliers = rarityMultipliers[rarity];
    
    return {
      baseCropType,
      rarity,
      growthSpeedMultiplier: multipliers.growth,
      yieldMultiplier: multipliers.yield,
      valueMultiplier: multipliers.value,
      specialEffects: specialEffects[rarity],
      traits: this.generateTraits(baseCropType, rarity)
    };
  };

  NftCrop.generateTraits = function(baseCropType, rarity) {
    const traits = {
      color: this.randomChoice(['Green', 'Golden', 'Rainbow', 'Crystal', 'Shadow']),
      pattern: this.randomChoice(['Solid', 'Striped', 'Spotted', 'Glowing', 'Ethereal']),
      size: this.randomChoice(['Small', 'Medium', 'Large', 'Giant', 'Colossal']),
      element: this.randomChoice(['Earth', 'Fire', 'Water', 'Air', 'Light', 'Dark']),
      season: this.randomChoice(['Spring', 'Summer', 'Autumn', 'Winter', 'Eternal'])
    };

    // Rarity affects trait quality
    if (rarity === 'legendary' || rarity === 'mythic') {
      traits.special = this.randomChoice(['Legendary Aura', 'Divine Blessing', 'Cosmic Power']);
    }

    return traits;
  };

  NftCrop.randomChoice = function(array) {
    return array[Math.floor(Math.random() * array.length)];
  };

  // Instance methods
  NftCrop.prototype.canBreed = function() {
    return this.breedCount < this.maxBreeds && this.isActive;
  };

  NftCrop.prototype.getTotalMultiplier = function() {
    return {
      growth: this.growthSpeedMultiplier,
      yield: this.yieldMultiplier,
      value: this.valueMultiplier
    };
  };

  NftCrop.prototype.getMarketValue = function() {
    const baseValue = {
      common: 100,
      uncommon: 250,
      rare: 500,
      epic: 1000,
      legendary: 2500,
      mythic: 5000
    };

    let value = baseValue[this.rarity] || 100;
    
    // Adjust for usage and harvests
    value += this.totalHarvests * 10;
    value += this.totalValue * 0.1;
    
    // Breeding affects value
    if (this.breedCount > 0) {
      value *= (1 - (this.breedCount * 0.1));
    }

    return Math.round(value);
  };

  NftCrop.prototype.evolve = function(requirements) {
    if (!this.canEvolve) return false;
    
    // Check evolution requirements
    const req = this.evolutionRequirements;
    if (req.harvests && this.totalHarvests < req.harvests) return false;
    if (req.value && this.totalValue < req.value) return false;
    
    // Evolve the NFT
    this.generation += 1;
    this.growthSpeedMultiplier *= 1.1;
    this.yieldMultiplier *= 1.1;
    this.valueMultiplier *= 1.2;
    
    return true;
  };

  NftCrop.prototype.getDisplayName = function() {
    const rarityPrefix = {
      common: '',
      uncommon: 'Shiny ',
      rare: 'Rare ',
      epic: 'Epic ',
      legendary: 'Legendary ',
      mythic: 'Mythic '
    };

    const cropNames = {
      potato: 'Potato',
      tomato: 'Tomato',
      onion: 'Onion',
      carrot: 'Carrot',
      wheat: 'Wheat',
      corn: 'Corn'
    };

    return `${rarityPrefix[this.rarity]}${cropNames[this.baseCropType]}`;
  };

  return NftCrop;
};