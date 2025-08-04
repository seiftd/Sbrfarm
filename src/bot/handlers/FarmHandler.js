const GameIcons = require('../utils/GameIcons');

class FarmHandler {
  constructor(bot, farmService, userService) {
    this.bot = bot;
    this.farmService = farmService;
    this.userService = userService;
  }

  async showFarm(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      const user = await this.userService.getUserByTelegramId(userId);
      if (!user) {
        await this.bot.sendMessage(chatId, '❌ User not found. Please start the bot first with /start');
        return;
      }

      const farm = await this.farmService.getUserFarm(user.id);
      const stats = await this.farmService.getFarmStatistics(user.id);

      let farmDisplay = '🌾 **Your Farm** 🌾\n\n';
      
      // Show patches in a grid
      for (let i = 0; i < farm.length; i++) {
        const patch = farm[i];
        if (i % 3 === 0) farmDisplay += '\n';
        
        if (patch.currentCrop) {
          const crop = patch.currentCrop;
          const icon = GameIcons.getCropIcon(crop.cropType);
          const progress = crop.getGrowthPercentage();
          farmDisplay += `${icon}${progress === 100 ? '✨' : ''} `;
        } else {
          farmDisplay += '🏞️ ';
        }
      }

      farmDisplay += `\n\n📊 **Farm Statistics:**
🏞️ Patches: ${stats.totalPatches}
🌱 Active Crops: ${stats.activeCrops}
✨ Ready to Harvest: ${stats.readyCrops}
🌾 Total Harvests: ${stats.totalHarvests}
📅 Today's Harvests: ${stats.todayHarvests}`;

      const keyboard = [
        [
          { text: '🌱 Plant Seeds', callback_data: 'farm_plant' },
          { text: '💧 Water Crops', callback_data: 'farm_water' }
        ],
        [
          { text: '🌾 Harvest', callback_data: 'farm_harvest' },
          { text: '⚡ Use Booster', callback_data: 'farm_booster' }
        ],
        [
          { text: '🔧 Expand Farm', callback_data: 'farm_expand' },
          { text: '🔄 Refresh', callback_data: 'farm_main' }
        ]
      ];

      await this.bot.sendMessage(chatId, farmDisplay, {
        reply_markup: { inline_keyboard: keyboard }
      });

    } catch (error) {
      console.error('Error showing farm:', error);
      await this.bot.sendMessage(chatId, '❌ Error loading farm. Please try again later.');
    }
  }

  async handleCallback(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const action = query.data.split('_')[1];

    try {
      switch (action) {
        case 'main':
          await this.showFarm({ chat: { id: chatId }, from: { id: userId } });
          break;
        default:
          await this.bot.sendMessage(chatId, '🚧 This feature is under development!');
      }
    } catch (error) {
      console.error('Error handling farm callback:', error);
      await this.bot.sendMessage(chatId, '❌ Something went wrong.');
    }
  }
}

module.exports = FarmHandler;