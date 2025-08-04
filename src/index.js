require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');

// Import database and services
const db = require('./database/models');
const UserService = require('./services/UserService');
const FarmService = require('./services/FarmService');
const ShopService = require('./services/ShopService');
const VipService = require('./services/VipService');
const ContestService = require('./services/ContestService');
const PaymentService = require('./services/PaymentService');
const TelegaAdsService = require('./services/TelegaAdsService');
const TaskService = require('./services/TaskService');

// Import bot handlers
const FarmHandler = require('./bot/handlers/FarmHandler');
const ShopHandler = require('./bot/handlers/ShopHandler');
const ProfileHandler = require('./bot/handlers/ProfileHandler');
const VipHandler = require('./bot/handlers/VipHandler');
const ContestHandler = require('./bot/handlers/ContestHandler');
const TaskHandler = require('./bot/handlers/TaskHandler');
const AdminHandler = require('./bot/handlers/AdminHandler');

// Import utilities
const BotUtils = require('./bot/utils/BotUtils');
const GameIcons = require('./bot/utils/GameIcons');
const SoundManager = require('./bot/utils/SoundManager');

class SbaroFarmerBot {
  constructor() {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
    this.app = express();
    this.port = process.env.PORT || 3000;
    
    this.initializeServices();
    this.initializeHandlers();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupBotHandlers();
    this.setupCronJobs();
  }

  initializeServices() {
    this.userService = new UserService();
    this.farmService = new FarmService();
    this.shopService = new ShopService();
    this.vipService = new VipService();
    this.contestService = new ContestService();
    this.paymentService = new PaymentService();
    this.telegaAdsService = new TelegaAdsService();
    this.taskService = new TaskService();
  }

  initializeHandlers() {
    this.farmHandler = new FarmHandler(this.bot, this.farmService, this.userService);
    this.shopHandler = new ShopHandler(this.bot, this.shopService, this.userService);
    this.profileHandler = new ProfileHandler(this.bot, this.userService, this.paymentService);
    this.vipHandler = new VipHandler(this.bot, this.vipService, this.userService);
    this.contestHandler = new ContestHandler(this.bot, this.contestService, this.userService);
    this.taskHandler = new TaskHandler(this.bot, this.taskService, this.userService);
    this.adminHandler = new AdminHandler(this.bot, this.userService);
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
  }

  setupRoutes() {
    // Webhook endpoint for Telegram
    this.app.post('/webhook', (req, res) => {
      this.bot.processUpdate(req.body);
      res.sendStatus(200);
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Game stats API
    this.app.get('/api/stats', async (req, res) => {
      try {
        const stats = await this.getGameStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
      }
    });
  }

  setupBotHandlers() {
    // Command handlers
    this.bot.onText(/\/start(.*)/, async (msg, match) => {
      await this.handleStart(msg, match);
    });

    this.bot.onText(/\/help/, async (msg) => {
      await this.handleHelp(msg);
    });

    this.bot.onText(/\/farm/, async (msg) => {
      await this.farmHandler.showFarm(msg);
    });

    this.bot.onText(/\/shop/, async (msg) => {
      await this.shopHandler.showShop(msg);
    });

    this.bot.onText(/\/profile/, async (msg) => {
      await this.profileHandler.showProfile(msg);
    });

    this.bot.onText(/\/vip/, async (msg) => {
      await this.vipHandler.showVipMenu(msg);
    });

    this.bot.onText(/\/contests/, async (msg) => {
      await this.contestHandler.showContests(msg);
    });

    this.bot.onText(/\/tasks/, async (msg) => {
      await this.taskHandler.showTasks(msg);
    });

    this.bot.onText(/\/bag/, async (msg) => {
      await this.profileHandler.showBag(msg);
    });

    this.bot.onText(/\/wallet/, async (msg) => {
      await this.profileHandler.showWallet(msg);
    });

    this.bot.onText(/\/admin (.+)/, async (msg, match) => {
      await this.adminHandler.handleAdminCommand(msg, match);
    });

    // Callback query handlers
    this.bot.on('callback_query', async (query) => {
      await this.handleCallbackQuery(query);
    });

    // Error handling
    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });

    this.bot.on('error', (error) => {
      console.error('Bot error:', error);
    });
  }

  async handleStart(msg, match) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const referralCode = match[1] ? match[1].trim() : null;

    try {
      // Get or create user
      const user = await this.userService.getOrCreateUser({
        telegramId: userId,
        username: msg.from.username,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name
      }, referralCode);

      // Create initial patches for new users
      if (user.isNewUser) {
        await this.farmService.createInitialPatches(user.id);
        await this.taskService.initializeUserTasks(user.id);
      }

      // Welcome message with farm sounds
      const welcomeMessage = `
🌾 Welcome to SBAROFARMER! 🌾

${user.isNewUser ? `Hello ${user.firstName}! Welcome to the most exciting farming adventure!` : `Welcome back, ${user.firstName}! Your farm awaits you!`}

🎯 **Your Starting Resources:**
💧 Water Drops: ${user.waterDrops}
🥔 Potato Seeds: ${user.potatoSeeds}
🏞️ Farm Patches: ${user.totalPatchesOwned}
💰 SBR Coins: ${user.sbrCoin}

🎮 **Quick Actions:**
• 🌾 /farm - Manage your farm
• 🛒 /shop - Buy seeds & boosters
• 👤 /profile - View your stats
• 🎁 /vip - VIP benefits
• 🏆 /contests - Enter competitions
• 📋 /tasks - Daily challenges
• 🎒 /bag - Your inventory

${user.isNewUser ? `\n🎁 **Beginner Tips:**
1. Plant your first potato seed
2. Water it regularly  
3. Harvest when ready
4. Sell crops for SBR coins
5. Watch ads for extra water!` : ''}

Let's start farming! 🚜
      `;

      await this.bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🌾 My Farm', callback_data: 'farm_main' },
              { text: '🛒 Shop', callback_data: 'shop_main' }
            ],
            [
              { text: '👤 Profile', callback_data: 'profile_main' },
              { text: '🎁 VIP', callback_data: 'vip_main' }
            ],
            [
              { text: '🏆 Contests', callback_data: 'contests_main' },
              { text: '📋 Tasks', callback_data: 'tasks_main' }
            ]
          ]
        }
      });

      // Play welcome sound
      if (user.soundEnabled) {
        await SoundManager.sendSound(this.bot, chatId, 'welcome');
      }

    } catch (error) {
      console.error('Start command error:', error);
      await this.bot.sendMessage(chatId, '❌ Sorry, something went wrong. Please try again later.');
    }
  }

  async handleHelp(msg) {
    const chatId = msg.chat.id;
    
    const helpMessage = `
🆘 **SBAROFARMER Help Guide** 🆘

🌾 **FARMING:**
• Plant seeds in your patches
• Water crops regularly (💧)
• Use boosters to speed growth (⚡)
• Harvest when crops are ready
• Sell crops for SBR coins

💰 **ECONOMY:**
• Earn SBR coins from harvests
• Convert: 200 SBR = 1 USDT
• Convert: 100 Water = 1 Heavy Water
• Convert: 10 Heavy Water = 5 SBR

🛒 **SHOP:**
• **Buy Section:** Seeds, boosters, patch parts
• **Sell Section:** Sell your harvested crops
• Potato: 50 SBR | Tomato: 100 SBR
• Onion: 1 USDT | Carrot: 5 USDT

🎒 **INVENTORY (BAG):**
• Water drops (max 100)
• Heavy water (max 5)
• Boosters (max 10)
• Seeds: Potato, Tomato, Onion, Carrot
• Patch parts (10 parts = 1 new patch)

🎁 **VIP BENEFITS:**
• Tier 1 ($7): +1 patch, daily rewards
• Tier 2 ($15): +1 patch, more rewards
• Tier 3 ($30): +2 patches, premium rewards
• Tier 4 ($99): +3 patches, ultimate rewards

🏆 **CONTESTS:**
• Daily: 20 SBR entry, 5 ads required
• Weekly: 100 SBR entry, 30 ads required
• Monthly: 200 SBR entry, 100 ads required

📋 **TASKS:**
• Complete daily, weekly challenges
• Earn rewards: SBR, water, boosters
• Achievement tasks for big prizes

💧 **GETTING WATER:**
• Daily check-in: 10 drops
• Watch ads: 1 drop per ad (1min cooldown)
• Join Telegram channel: 5 drops
• Refer friends: 1-10 drops

🔧 **COMMANDS:**
/farm - Farm management
/shop - Marketplace  
/profile - Your statistics
/vip - VIP subscription
/contests - Competitions
/tasks - Challenges
/bag - Inventory
/wallet - Payment methods
/help - This help guide

Need more help? Contact our support team! 🤝
    `;

    await this.bot.sendMessage(chatId, helpMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🌾 Start Farming', callback_data: 'farm_main' },
            { text: '🛒 Visit Shop', callback_data: 'shop_main' }
          ],
          [
            { text: '🎁 Get VIP', callback_data: 'vip_main' },
            { text: '📋 View Tasks', callback_data: 'tasks_main' }
          ]
        ]
      }
    });
  }

  async handleCallbackQuery(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;

    try {
      // Acknowledge callback query
      await this.bot.answerCallbackQuery(query.id);

      // Route to appropriate handler
      if (data.startsWith('farm_')) {
        await this.farmHandler.handleCallback(query);
      } else if (data.startsWith('shop_')) {
        await this.shopHandler.handleCallback(query);
      } else if (data.startsWith('profile_')) {
        await this.profileHandler.handleCallback(query);
      } else if (data.startsWith('vip_')) {
        await this.vipHandler.handleCallback(query);
      } else if (data.startsWith('contest_')) {
        await this.contestHandler.handleCallback(query);
      } else if (data.startsWith('task_')) {
        await this.taskHandler.handleCallback(query);
      } else if (data.startsWith('admin_')) {
        await this.adminHandler.handleCallback(query);
      } else if (data.startsWith('ads_')) {
        await this.handleAdsCallback(query);
      } else if (data.startsWith('wallet_')) {
        await this.profileHandler.handleWalletCallback(query);
      }

    } catch (error) {
      console.error('Callback query error:', error);
      await this.bot.sendMessage(chatId, '❌ Something went wrong. Please try again.');
    }
  }

  async handleAdsCallback(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const action = query.data.split('_')[1];

    const user = await this.userService.getUserByTelegramId(userId);
    if (!user) return;

    if (action === 'watch') {
      if (!user.canWatchAd()) {
        await this.bot.sendMessage(chatId, '⏰ Please wait 1 minute before watching another ad.');
        return;
      }

      // Generate ad with Telega.io
      const adResult = await this.telegaAdsService.generateAd(user.id);
      
      if (adResult.success) {
        await this.bot.sendMessage(chatId, `
📺 **Advertisement Ready!**

Click the link below to watch the ad:
${adResult.adUrl}

You'll receive 1 💧 water drop after watching!
        `, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📺 Watch Ad', url: adResult.adUrl }],
              [{ text: '✅ I Watched It', callback_data: 'ads_complete' }]
            ]
          }
        });
      } else {
        await this.bot.sendMessage(chatId, '❌ Ad not available right now. Please try again later.');
      }
    } else if (action === 'complete') {
      // Verify ad completion and reward user
      const verified = await this.telegaAdsService.verifyAdCompletion(user.id);
      
      if (verified) {
        user.addWater(1);
        user.totalAdsWatched += 1;
        user.lastAdWatch = new Date();
        await user.save();

        // Update task progress
        await this.taskService.updateTaskProgress(user.id, 'ads_watched', 1);

        await this.bot.sendMessage(chatId, `
✅ **Ad Completed!**

You received: 💧 +1 Water Drop
Total water: ${user.waterDrops}
Total ads watched: ${user.totalAdsWatched}

Keep watching ads to earn more water! 💪
        `);

        // Play reward sound
        if (user.soundEnabled) {
          await SoundManager.sendSound(this.bot, chatId, 'water_drop');
        }
      } else {
        await this.bot.sendMessage(chatId, '❌ Ad completion not verified. Please make sure you watched the full ad.');
      }
    }
  }

  setupCronJobs() {
    // Daily reset at 00:00 UTC
    cron.schedule('0 0 * * *', async () => {
      console.log('Running daily reset...');
      await this.dailyReset();
    });

    // Check crop harvests every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.checkCropHarvests();
    });

    // Contest management every hour
    cron.schedule('0 * * * *', async () => {
      await this.contestService.manageContests();
    });

    // VIP daily rewards at 00:05 UTC
    cron.schedule('5 0 * * *', async () => {
      await this.vipService.distributeDailyRewards();
    });

    // Clean up expired data daily
    cron.schedule('0 2 * * *', async () => {
      await this.cleanupExpiredData();
    });
  }

  async dailyReset() {
    try {
      // Reset daily water claims
      const users = await db.User.findAll();
      
      for (const user of users) {
        if (user.canClaimDailyWater()) {
          user.addWater(10);
          user.lastDailyWater = new Date();
          await user.save();
        }
      }

      console.log(`Daily reset completed for ${users.length} users`);
    } catch (error) {
      console.error('Daily reset error:', error);
    }
  }

  async checkCropHarvests() {
    try {
      const readyCrops = await db.Crop.findAll({
        where: {
          isHarvested: false,
          harvestAt: {
            [db.Sequelize.Op.lte]: new Date()
          }
        },
        include: ['user']
      });

      for (const crop of readyCrops) {
        // Send notification to user
        const message = `
🌾 **Crop Ready for Harvest!** 🌾

Your ${GameIcons.getCropIcon(crop.cropType)} ${crop.cropType} is ready!

Harvest it now to earn SBR coins! 💰
        `;

        try {
          await this.bot.sendMessage(crop.user.telegramId, message, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🌾 Go to Farm', callback_data: 'farm_main' }]
              ]
            }
          });

          // Play harvest sound
          if (crop.user.soundEnabled) {
            await SoundManager.sendSound(this.bot, crop.user.telegramId, 'harvest_ready');
          }
        } catch (sendError) {
          console.error(`Failed to notify user ${crop.user.telegramId}:`, sendError.message);
        }
      }

      if (readyCrops.length > 0) {
        console.log(`Sent harvest notifications for ${readyCrops.length} crops`);
      }
    } catch (error) {
      console.error('Check crop harvests error:', error);
    }
  }

  async cleanupExpiredData() {
    try {
      // Remove old contests
      await db.Contest.destroy({
        where: {
          endDate: {
            [db.Sequelize.Op.lt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days old
          }
        }
      });

      // Remove old transactions
      await db.Transaction.destroy({
        where: {
          createdAt: {
            [db.Sequelize.Op.lt]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days old
          },
          status: 'completed'
        }
      });

      console.log('Cleanup completed');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  async getGameStats() {
    try {
      const [
        totalUsers,
        activeUsers,
        totalCrops,
        totalTransactions,
        vipUsers
      ] = await Promise.all([
        db.User.count(),
        db.User.count({ where: { lastActive: { [db.Sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
        db.Crop.count(),
        db.Transaction.count(),
        db.User.count({ where: { isVip: true } })
      ]);

      return {
        totalUsers,
        activeUsers,
        totalCrops,
        totalTransactions,
        vipUsers,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Get game stats error:', error);
      throw error;
    }
  }

  async start() {
    try {
      // Initialize database
      await db.sequelize.authenticate();
      console.log('Database connected successfully');
      
      // Sync database models
      await db.sequelize.sync({ alter: true });
      console.log('Database models synchronized');

      // Create default tasks
      await db.Task.createDefaultTasks();
      console.log('Default tasks created');

      // Start Express server
      this.app.listen(this.port, () => {
        console.log(`🚀 SBAROFARMER Bot server running on port ${this.port}`);
      });

      console.log('🌾 SBAROFARMER Telegram Bot is running!');
      console.log('Bot username:', (await this.bot.getMe()).username);

    } catch (error) {
      console.error('Failed to start bot:', error);
      process.exit(1);
    }
  }

  async stop() {
    try {
      await this.bot.stopPolling();
      await db.sequelize.close();
      console.log('Bot stopped gracefully');
    } catch (error) {
      console.error('Error stopping bot:', error);
    }
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Received SIGINT, stopping bot...');
  if (global.bot) {
    await global.bot.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, stopping bot...');
  if (global.bot) {
    await global.bot.stop();
  }
  process.exit(0);
});

// Start the bot
if (require.main === module) {
  const bot = new SbaroFarmerBot();
  global.bot = bot;
  bot.start().catch(console.error);
}

module.exports = SbaroFarmerBot;