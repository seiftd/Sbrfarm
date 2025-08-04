const db = require('../database/models');

class ShopService {
  constructor() {
    this.shopItems = {
      buy: {
        seeds: {
          potato: { price: 50, currency: 'sbr' },
          tomato: { price: 100, currency: 'sbr' },
          onion: { price: 1, currency: 'usdt' },
          carrot: { price: 5, currency: 'usdt' }
        },
        boosters: {
          basic: { price: 25, currency: 'sbr' }
        },
        patchParts: {
          single: { price: 0.5, currency: 'usdt' },
          bundle: { price: 100, currency: 'sbr', amount: 1 }
        },
        water: {
          drops: { price: 1, currency: 'sbr', amount: 1 },
          heavy: { price: 5, currency: 'sbr', amount: 1 }
        }
      },
      sell: {
        crops: {
          potato: { price: 100, currency: 'sbr' },
          tomato: { price: 150, currency: 'sbr' },
          onion: { price: 250, currency: 'sbr' },
          carrot: { price: 1300, currency: 'sbr' }
        }
      }
    };
  }

  getShopItems(section = 'buy') {
    return this.shopItems[section] || {};
  }

  async buyItem(userId, category, itemType, quantity = 1) {
    try {
      const user = await db.User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const item = this.shopItems.buy[category]?.[itemType];
      if (!item) {
        throw new Error('Item not found');
      }

      const totalCost = item.price * quantity;
      const currency = item.currency;

      // Check if user has enough currency
      if (currency === 'sbr' && user.sbrCoin < totalCost) {
        throw new Error('Insufficient SBR coins');
      } else if (currency === 'usdt' && user.usdtBalance < totalCost) {
        throw new Error('Insufficient USDT');
      }

      // Process purchase based on category
      let success = false;

      switch (category) {
        case 'seeds':
          const seedField = `${itemType}Seeds`;
          user[seedField] += quantity;
          success = true;
          break;

        case 'boosters':
          const maxBoosters = process.env.MAX_BOOSTERS || 10;
          if (user.boosters + quantity <= maxBoosters) {
            user.boosters += quantity;
            success = true;
          } else {
            throw new Error('Booster limit reached');
          }
          break;

        case 'patchParts':
          user.patchParts += (item.amount || 1) * quantity;
          success = true;
          break;

        case 'water':
          if (itemType === 'drops') {
            user.addWater(quantity);
          } else if (itemType === 'heavy') {
            const maxHeavy = process.env.MAX_HEAVY_WATER || 5;
            if (user.heavyWaterDrops + quantity <= maxHeavy) {
              user.heavyWaterDrops += quantity;
            } else {
              throw new Error('Heavy water limit reached');
            }
          }
          success = true;
          break;
      }

      if (success) {
        // Deduct currency
        if (currency === 'sbr') {
          user.sbrCoin -= totalCost;
        } else if (currency === 'usdt') {
          user.usdtBalance = parseFloat(user.usdtBalance) - totalCost;
        }

        await user.save();

        // Create transaction record
        await db.Transaction.create({
          userId,
          type: 'shop_purchase',
          currency: currency === 'sbr' ? 'sbr_coin' : currency,
          amount: totalCost,
          status: 'completed',
          description: `Bought ${quantity}x ${itemType} from shop`
        });

        return {
          success: true,
          item: itemType,
          quantity,
          totalCost,
          currency,
          userBalance: currency === 'sbr' ? user.sbrCoin : user.usdtBalance
        };
      }

      throw new Error('Purchase failed');
    } catch (error) {
      console.error('Error buying item:', error);
      throw error;
    }
  }

  async sellCrop(userId, cropType, quantity = 1) {
    try {
      const user = await db.User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // For now, assume crops are sold from harvested inventory
      // In a full implementation, you'd track harvested crops separately
      const cropPrice = this.shopItems.sell.crops[cropType];
      if (!cropPrice) {
        throw new Error('Cannot sell this crop type');
      }

      const totalEarnings = cropPrice.price * quantity;

      // Add earnings to user
      user.sbrCoin += totalEarnings;
      await user.save();

      // Create transaction record
      await db.Transaction.create({
        userId,
        type: 'shop_purchase', // Selling is recorded as negative purchase
        currency: 'sbr_coin',
        amount: -totalEarnings, // Negative amount for sales
        status: 'completed',
        description: `Sold ${quantity}x ${cropType} in shop`
      });

      return {
        success: true,
        cropType,
        quantity,
        earnings: totalEarnings,
        newBalance: user.sbrCoin
      };
    } catch (error) {
      console.error('Error selling crop:', error);
      throw error;
    }
  }

  async getShopStatistics(userId) {
    try {
      const [
        totalPurchases,
        totalSpent,
        totalSales,
        totalEarned
      ] = await Promise.all([
        db.Transaction.count({
          where: {
            userId,
            type: 'shop_purchase',
            amount: { [db.Sequelize.Op.gt]: 0 }
          }
        }),
        db.Transaction.sum('amount', {
          where: {
            userId,
            type: 'shop_purchase',
            amount: { [db.Sequelize.Op.gt]: 0 }
          }
        }),
        db.Transaction.count({
          where: {
            userId,
            type: 'shop_purchase',
            amount: { [db.Sequelize.Op.lt]: 0 }
          }
        }),
        db.Transaction.sum('amount', {
          where: {
            userId,
            type: 'shop_purchase',
            amount: { [db.Sequelize.Op.lt]: 0 }
          }
        })
      ]);

      return {
        totalPurchases: totalPurchases || 0,
        totalSpent: totalSpent || 0,
        totalSales: totalSales || 0,
        totalEarned: Math.abs(totalEarned || 0)
      };
    } catch (error) {
      console.error('Error getting shop statistics:', error);
      throw error;
    }
  }

  async getPopularItems(limit = 5) {
    try {
      const popularItems = await db.Transaction.findAll({
        where: {
          type: 'shop_purchase',
          amount: { [db.Sequelize.Op.gt]: 0 }
        },
        attributes: [
          'description',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'purchaseCount']
        ],
        group: ['description'],
        order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'DESC']],
        limit
      });

      return popularItems;
    } catch (error) {
      console.error('Error getting popular items:', error);
      throw error;
    }
  }

  async updateShopPrices(category, itemType, newPrice) {
    try {
      if (this.shopItems.buy[category] && this.shopItems.buy[category][itemType]) {
        this.shopItems.buy[category][itemType].price = newPrice;
        return true;
      } else if (this.shopItems.sell[category] && this.shopItems.sell[category][itemType]) {
        this.shopItems.sell[category][itemType].price = newPrice;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating shop prices:', error);
      return false;
    }
  }

  async getUserPurchaseHistory(userId, limit = 10) {
    try {
      return await db.Transaction.findAll({
        where: {
          userId,
          type: 'shop_purchase'
        },
        order: [['createdAt', 'DESC']],
        limit
      });
    } catch (error) {
      console.error('Error getting purchase history:', error);
      throw error;
    }
  }

  getItemDescription(category, itemType) {
    const descriptions = {
      seeds: {
        potato: '🥔 Fast-growing crop, ready in 24 hours',
        tomato: '🍅 Medium growth time, ready in 48 hours',
        onion: '🧅 Slow growth but high value, ready in 96 hours',
        carrot: '🥕 Premium crop, ready in 144 hours'
      },
      boosters: {
        basic: '⚡ Reduces crop growth time by 2 hours'
      },
      patchParts: {
        single: '🔧 Collect 10 parts to unlock a new patch',
        bundle: '🔧 One patch part for expansion'
      },
      water: {
        drops: '💧 Regular water for small crops',
        heavy: '🌊 Heavy water for large crops'
      }
    };

    return descriptions[category]?.[itemType] || 'No description available';
  }

  canAfford(user, category, itemType, quantity = 1) {
    const item = this.shopItems.buy[category]?.[itemType];
    if (!item) return false;

    const totalCost = item.price * quantity;
    const currency = item.currency;

    if (currency === 'sbr') {
      return user.sbrCoin >= totalCost;
    } else if (currency === 'usdt') {
      return parseFloat(user.usdtBalance) >= totalCost;
    }

    return false;
  }
}

module.exports = ShopService;