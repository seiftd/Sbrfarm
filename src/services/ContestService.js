const db = require('../database/models');

class ContestService {
  async getActiveContests() {
    return [];
  }

  async joinContest(userId, contestId) {
    return { success: false, message: 'Contest service not yet implemented' };
  }

  async manageContests() {
    console.log('Contest management - placeholder');
  }
}

module.exports = ContestService;