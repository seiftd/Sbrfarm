class VipHandler {
  constructor(bot, vipService, userService) {
    this.bot = bot;
    this.vipService = vipService;
    this.userService = userService;
  }

  async showVipMenu(msg) {
    const chatId = msg.chat.id;
    await this.bot.sendMessage(chatId, '🎁 VIP features coming soon! 🚧');
  }

  async handleCallback(query) {
    const chatId = query.message.chat.id;
    await this.bot.sendMessage(chatId, '🚧 VIP features under development!');
  }
}

module.exports = VipHandler;