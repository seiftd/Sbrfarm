module.exports = (sequelize, DataTypes) => {
  const Referral = sequelize.define('Referral', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    referrerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    referredId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    referralCode: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    bonusAwarded: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    referredAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'referrals',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['referrerId', 'referredId']
      }
    ]
  });

  return Referral;
};