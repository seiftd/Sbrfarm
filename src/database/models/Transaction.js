module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
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
    type: {
      type: DataTypes.ENUM('deposit', 'withdrawal', 'vip_purchase', 'shop_purchase', 'contest_entry', 'referral_bonus'),
      allowNull: false
    },
    currency: {
      type: DataTypes.ENUM('usdt', 'ton', 'sbr_coin'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed'),
      defaultValue: 'pending'
    },
    paymentMethod: {
      type: DataTypes.ENUM('binance_pay', 'ton_wallet', 'trc20', 'manual'),
      allowNull: true
    },
    externalTxId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    walletAddress: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    processedBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'transactions',
    timestamps: true
  });

  return Transaction;
};