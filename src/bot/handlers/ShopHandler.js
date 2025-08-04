class ShopHandler {
  constructor(bot, shopService, userService) {
    this.bot = bot;
    this.shopService = shopService;
    this.userService = userService;
  }

  async showShop(msg) {
    const chatId = msg.chat.id;
    await this.bot.sendMessage(chatId, '🛒 Shop coming soon! 🚧');
  }

  async handleCallback(query) {
    const chatId = query.message.chat.id;
    await this.bot.sendMessage(chatId, '🚧 Shop features under development!');
  }
}

module.exports = ShopHandler;