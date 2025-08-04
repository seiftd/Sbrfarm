module.exports = (sequelize, DataTypes) => {
  const GameConfig = sequelize.define('GameConfig', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    key: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
      defaultValue: 'string'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING(50),
      defaultValue: 'general'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'game_configs',
    timestamps: true
  });

  // Static method to get config value
  GameConfig.getValue = async function(key, defaultValue = null) {
    const config = await GameConfig.findOne({ where: { key, isActive: true } });
    if (!config) return defaultValue;
    
    switch (config.type) {
      case 'number': return parseFloat(config.value);
      case 'boolean': return config.value === 'true';
      case 'json': return JSON.parse(config.value);
      default: return config.value;
    }
  };

  // Static method to set config value
  GameConfig.setValue = async function(key, value, type = 'string', description = null) {
    const stringValue = type === 'json' ? JSON.stringify(value) : String(value);
    
    const [config] = await GameConfig.findOrCreate({
      where: { key },
      defaults: { key, value: stringValue, type, description }
    });
    
    if (config.value !== stringValue || config.type !== type) {
      config.value = stringValue;
      config.type = type;
      if (description) config.description = description;
      await config.save();
    }
    
    return config;
  };

  return GameConfig;
};