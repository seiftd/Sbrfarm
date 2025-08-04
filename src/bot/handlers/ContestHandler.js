class ContestHandler {
  constructor(bot, contestService, userService) {
    this.bot = bot;
    this.contestService = contestService;
    this.userService = userService;
  }

  async showContests(msg) {
    const chatId = msg.chat.id;
    await this.bot.sendMessage(chatId, '🏆 Contests coming soon! 🚧');
  }

  async handleCallback(query) {
    const chatId = query.message.chat.id;
    await this.bot.sendMessage(chatId, '🚧 Contest features under development!');
  }
}

module.exports = ContestHandler;