const db = require('../database/models');

class PaymentService {
  async processDeposit(userId, amount, currency, method) {
    return { success: false, message: 'Payment service not yet implemented' };
  }

  async processWithdrawal(userId, amount, currency, method, address) {
    return { success: false, message: 'Payment service not yet implemented' };
  }

  async getTransactionHistory(userId, limit = 10) {
    try {
      return await db.Transaction.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit
      });
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }
}

module.exports = PaymentService;