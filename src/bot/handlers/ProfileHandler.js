const GameIcons = require('../utils/GameIcons');

class ProfileHandler {
  constructor(bot, userService, paymentService) {
    this.bot = bot;
    this.userService = userService;
    this.paymentService = paymentService;
  }

  async showProfile(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      const user = await this.userService.getUserByTelegramId(userId);
      if (!user) {
        await this.bot.sendMessage(chatId, '❌ User not found. Please start with /start');
        return;
      }

      const profileMessage = `
👤 **${user.firstName}'s Profile**

💰 **Wallet:**
${GameIcons.ITEMS.sbrCoin} SBR Coins: ${GameIcons.formatNumber(user.sbrCoin)}
${GameIcons.ITEMS.usdt} USDT: ${user.usdtBalance}
${GameIcons.ITEMS.ton} TON: ${user.tonBalance}

📊 **Statistics:**
🌾 Total Harvests: ${user.totalCropsHarvested}
🏞️ Farm Patches: ${user.totalPatchesOwned}
📺 Ads Watched: ${user.totalAdsWatched}
👥 Referrals: ${user.totalReferrals}

${user.isVip ? `${GameIcons.getVipIcon(user.vipTier)} VIP Tier ${user.vipTier}` : ''}

📅 Member since: ${new Date(user.registeredAt).toLocaleDateString()}
      `;

      const keyboard = [
        [
          { text: '🎒 Inventory', callback_data: 'profile_bag' },
          { text: '💳 Wallet', callback_data: 'profile_wallet' }
        ],
        [
          { text: '👥 Referrals', callback_data: 'profile_referrals' },
          { text: '⚙️ Settings', callback_data: 'profile_settings' }
        ]
      ];

      await this.bot.sendMessage(chatId, profileMessage, {
        reply_markup: { inline_keyboard: keyboard }
      });

    } catch (error) {
      console.error('Error showing profile:', error);
      await this.bot.sendMessage(chatId, '❌ Error loading profile.');
    }
  }

  async showBag(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      const user = await this.userService.getUserByTelegramId(userId);
      if (!user) {
        await this.bot.sendMessage(chatId, '❌ User not found.');
        return;
      }

      const inventoryMessage = GameIcons.createInventoryDisplay(user);

      const keyboard = [
        [
          { text: '🔄 Convert Water', callback_data: 'profile_convert_water' },
          { text: '💱 Convert SBR', callback_data: 'profile_convert_sbr' }
        ],
        [
          { text: '↩️ Back to Profile', callback_data: 'profile_main' }
        ]
      ];

      await this.bot.sendMessage(chatId, inventoryMessage, {
        reply_markup: { inline_keyboard: keyboard }
      });

    } catch (error) {
      console.error('Error showing bag:', error);
      await this.bot.sendMessage(chatId, '❌ Error loading inventory.');
    }
  }

  async showWallet(msg) {
    const chatId = msg.chat.id;
    await this.bot.sendMessage(chatId, '💳 Wallet features coming soon! 🚧');
  }

  async handleCallback(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const action = query.data.split('_')[1];

    try {
      switch (action) {
        case 'main':
          await this.showProfile({ chat: { id: chatId }, from: { id: userId } });
          break;
        case 'bag':
          await this.showBag({ chat: { id: chatId }, from: { id: userId } });
          break;
        case 'wallet':
          await this.showWallet({ chat: { id: chatId }, from: { id: userId } });
          break;
        default:
          await this.bot.sendMessage(chatId, '🚧 Feature under development!');
      }
    } catch (error) {
      console.error('Error handling profile callback:', error);
      await this.bot.sendMessage(chatId, '❌ Something went wrong.');
    }
  }

  async handleWalletCallback(query) {
    const chatId = query.message.chat.id;
    await this.bot.sendMessage(chatId, '🚧 Wallet features under development!');
  }
}

module.exports = ProfileHandler;