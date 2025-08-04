class AdminHandler {
  constructor(bot, userService) {
    this.bot = bot;
    this.userService = userService;
  }

  async handleAdminCommand(msg, match) {
    const chatId = msg.chat.id;
    await this.bot.sendMessage(chatId, '👨‍💼 Admin features coming soon! 🚧');
  }

  async handleCallback(query) {
    const chatId = query.message.chat.id;
    await this.bot.sendMessage(chatId, '🚧 Admin features under development!');
  }
}

module.exports = AdminHandler;