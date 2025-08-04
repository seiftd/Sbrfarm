const db = require('../database/models');

class UserService {
  async getOrCreateUser(userData, referralCode = null) {
    try {
      const [user, created] = await db.User.findOrCreate({
        where: { telegramId: userData.telegramId },
        defaults: {
          ...userData,
          referredBy: referralCode ? await this.getReferrerIdByCode(referralCode) : null
        }
      });

      // Handle referral bonus
      if (created && referralCode) {
        await this.handleReferralBonus(user, referralCode);
      }

      // Update last active
      user.lastActive = new Date();
      await user.save();

      // Add isNewUser flag for new users
      user.isNewUser = created;

      return user;
    } catch (error) {
      console.error('Error in getOrCreateUser:', error);
      throw error;
    }
  }

  async getReferrerIdByCode(referralCode) {
    try {
      const referrer = await db.User.findOne({
        where: { referralCode },
        attributes: ['id']
      });
      return referrer ? referrer.id : null;
    } catch (error) {
      console.error('Error getting referrer:', error);
      return null;
    }
  }

  async handleReferralBonus(newUser, referralCode) {
    try {
      const referrer = await db.User.findOne({
        where: { referralCode }
      });

      if (!referrer) return;

      // Create referral record
      await db.Referral.create({
        referrerId: referrer.id,
        referredId: newUser.id,
        referralCode: referralCode,
        bonusAwarded: 5 // Base bonus
      });

      // Give bonus to referrer
      referrer.addWater(5);
      referrer.totalReferrals += 1;
      await referrer.save();

      // Give bonus to new user
      newUser.addWater(3);
      await newUser.save();

      console.log(`Referral bonus applied: ${referrer.id} -> ${newUser.id}`);
    } catch (error) {
      console.error('Error handling referral bonus:', error);
    }
  }

  async getUserByTelegramId(telegramId) {
    try {
      return await db.User.findOne({
        where: { telegramId },
        include: [
          { model: db.Patch, as: 'patches' },
          { model: db.VipSubscription, as: 'vipSubscription' }
        ]
      });
    } catch (error) {
      console.error('Error getting user by telegram ID:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      return await db.User.findByPk(userId, {
        include: [
          { model: db.Patch, as: 'patches' },
          { model: db.VipSubscription, as: 'vipSubscription' }
        ]
      });
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  async updateUserStats(userId, stats) {
    try {
      const user = await db.User.findByPk(userId);
      if (!user) throw new Error('User not found');

      Object.assign(user, stats);
      await user.save();

      return user;
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  async getAllUsers(options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        filter = {}
      } = options;

      const offset = (page - 1) * limit;

      return await db.User.findAndCountAll({
        where: filter,
        order: [[sortBy, sortOrder]],
        limit,
        offset,
        include: [
          { model: db.VipSubscription, as: 'vipSubscription' }
        ]
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async banUser(userId, reason) {
    try {
      const user = await db.User.findByPk(userId);
      if (!user) throw new Error('User not found');

      user.isBanned = true;
      user.banReason = reason;
      await user.save();

      return user;
    } catch (error) {
      console.error('Error banning user:', error);
      throw error;
    }
  }

  async unbanUser(userId) {
    try {
      const user = await db.User.findByPk(userId);
      if (!user) throw new Error('User not found');

      user.isBanned = false;
      user.banReason = null;
      await user.save();

      return user;
    } catch (error) {
      console.error('Error unbanning user:', error);
      throw error;
    }
  }

  async getUserReferrals(userId) {
    try {
      return await db.Referral.findAll({
        where: { referrerId: userId },
        include: [
          { model: db.User, as: 'referred', attributes: ['firstName', 'username', 'createdAt'] }
        ],
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      console.error('Error getting user referrals:', error);
      throw error;
    }
  }

  async getDashboardStats() {
    try {
      const [
        totalUsers,
        newUsersToday,
        activeUsersWeek,
        bannedUsers,
        vipUsers
      ] = await Promise.all([
        db.User.count(),
        db.User.count({
          where: {
            createdAt: {
              [db.Sequelize.Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        db.User.count({
          where: {
            lastActive: {
              [db.Sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        db.User.count({ where: { isBanned: true } }),
        db.User.count({ where: { isVip: true } })
      ]);

      return {
        totalUsers,
        newUsersToday,
        activeUsersWeek,
        bannedUsers,
        vipUsers
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  async getTopUsers(limit = 10) {
    try {
      return await db.User.findAll({
        order: [
          ['totalCropsHarvested', 'DESC'],
          ['sbrCoin', 'DESC']
        ],
        limit,
        attributes: ['firstName', 'username', 'totalCropsHarvested', 'sbrCoin', 'isVip']
      });
    } catch (error) {
      console.error('Error getting top users:', error);
      throw error;
    }
  }
}

module.exports = UserService;