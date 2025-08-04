# 🌾 SBAROFARMER - Telegram Farming Game

A comprehensive Telegram farming game with VIP subscriptions, contests, admin panel, and cryptocurrency integration.

## 🎯 Features

### 🌱 Core Farming Mechanics
- **Crop System**: 4 crop types (Potato, Tomato, Onion, Carrot) with different growth times
- **Farm Patches**: Start with 3 patches, expand up to 8 with VIP or patch parts
- **Water Management**: Daily water, ad rewards, referral bonuses
- **Growth Boosters**: Speed up crop growth with time reduction boosters
- **Real-time Notifications**: Get notified when crops are ready for harvest

### 💰 Economy System
- **SBR Coins**: In-game currency earned from harvests
- **Multi-currency Wallet**: USDT, TON, SBR coins
- **Conversion System**: 
  - 200 SBR = 1 USDT
  - 100 Water = 1 Heavy Water  
  - 10 Heavy Water = 5 SBR
- **Withdrawal System**: Binance Pay, TON Wallet, TRC20

### 🎁 VIP Subscription System
- **4 VIP Tiers** ($7, $15, $30, $99/month)
- **Daily Rewards**: Seeds, water, patch parts
- **Extra Patches**: Up to 3 additional patches
- **Special Benefits**: Enhanced rewards and bonuses

### 🏆 Contest System
- **Daily Contests**: 20 SBR entry, 5 ads required
- **Weekly Contests**: 100 SBR entry, 30 ads required  
- **Monthly Contests**: 200 SBR entry, 100 ads required, VIP prizes
- **Automated Management**: Winners selected automatically

### 📋 Task System
- **Daily Tasks**: Planting, watering, ad watching
- **Weekly Challenges**: Harvest goals, referral targets
- **Achievement Tasks**: Long-term progression goals
- **Reward System**: SBR coins, water, boosters, seeds

### 🛒 Shop System
- **Buy Section**: Seeds, boosters, patch parts
- **Sell Section**: Sell harvested crops for SBR coins
- **Dynamic Pricing**: Different prices for different crop types

### 📱 Telega.io Ads Integration
- **Ad Rewards**: 1 water drop per ad
- **Cooldown System**: 1-minute cooldown between ads
- **Contest Requirements**: Ads watched count for contest entries

### 👨‍💼 Admin Panel
- **User Management**: View, ban, analyze users
- **Transaction Control**: Approve/reject withdrawals
- **Contest Management**: Create and manage contests
- **Analytics Dashboard**: Real-time statistics
- **Payment Oversight**: Monitor all transactions

### 🎵 Enhanced UX
- **Game Sounds**: Farming sounds, notifications, music
- **Rich Icons**: Comprehensive emoji system
- **Beautiful UI**: Game-like interface with progress bars
- **Background Music**: Immersive farming atmosphere

## 🚀 Installation

### Prerequisites
- Node.js 16+ 
- MySQL 8.0+
- Telegram Bot Token
- Domain with SSL (for webhooks)

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd sbarofarmer-telegram-game
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE sbarofarmer;
exit

# Copy environment file
cp .env.example .env
```

### 4. Configure Environment Variables
Edit `.env` file:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
WEBHOOK_URL=https://yourdomain.com/webhook

# Database Configuration  
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sbarofarmer
DB_USER=root
DB_PASSWORD=your_mysql_password

# Admin Panel
ADMIN_JWT_SECRET=your_32_character_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

# Payment APIs
BINANCE_PAY_API_KEY=your_binance_key
TON_WALLET_API=your_ton_api_key
USDT_TRC20_API=your_trc20_api_key

# Telega.io Ads
TELEGA_API_KEY=your_telega_api_key
TELEGA_SITE_ID=your_site_id

# Server Configuration
PORT=3000
ADMIN_PORT=3001
NODE_ENV=production
```

### 5. Run Database Migrations
```bash
npm run migrate
```

### 6. Start the Application

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

#### Admin Panel (Separate Process)
```bash
npm run admin
```

## 🎮 Bot Commands

### User Commands
- `/start` - Register and start farming
- `/farm` - View and manage your farm
- `/shop` - Buy seeds, boosters, sell crops
- `/profile` - View your statistics and wallet
- `/vip` - VIP subscription management
- `/contests` - Enter competitions
- `/tasks` - View and complete challenges
- `/bag` - Check your inventory
- `/wallet` - Manage payments and withdrawals
- `/help` - Comprehensive help guide

### Admin Commands
- `/admin stats` - Server statistics
- `/admin user <telegram_id>` - User information
- `/admin ban <telegram_id> <reason>` - Ban user
- `/admin unban <telegram_id>` - Unban user
- `/admin broadcast <message>` - Send message to all users

## 🏗️ Architecture

### Backend Services
- **UserService**: User management and referrals
- **FarmService**: Crop and patch management
- **ShopService**: Marketplace operations
- **VipService**: Subscription handling
- **ContestService**: Competition management
- **PaymentService**: Transaction processing
- **TelegaAdsService**: Advertisement integration
- **TaskService**: Challenge and achievement system

### Database Models
- **User**: Player profiles and stats
- **Patch**: Farm patch information
- **Crop**: Individual crop tracking
- **VipSubscription**: VIP membership data
- **Contest**: Competition details
- **ContestEntry**: Participation records
- **Transaction**: Payment history
- **Task**: Challenge definitions
- **UserTask**: Progress tracking
- **Referral**: Referral system
- **AdminUser**: Admin authentication
- **GameConfig**: Dynamic configuration

### Bot Handlers
- **FarmHandler**: Farm management interface
- **ShopHandler**: Marketplace interface
- **ProfileHandler**: User profile and wallet
- **VipHandler**: VIP subscription interface
- **ContestHandler**: Competition interface
- **TaskHandler**: Challenge interface
- **AdminHandler**: Admin commands

## 📊 Admin Panel

Access the admin panel at `http://localhost:3001`

### Features
- **Dashboard**: Real-time statistics and charts
- **User Management**: Search, view, ban/unban users
- **Transaction Monitor**: Approve/reject withdrawals
- **Contest Control**: Create and manage competitions
- **Analytics**: User growth, revenue, engagement metrics
- **Settings**: Game configuration and parameters

### Default Admin Credentials
- Username: `admin` (configurable in .env)
- Password: `admin123` (configurable in .env)

## 💳 Payment Integration

### Supported Methods
1. **Binance Pay**: Instant USDT transactions
2. **TON Wallet**: TON cryptocurrency payments
3. **TRC20**: USDT on Tron network

### Withdrawal Process
1. User requests withdrawal
2. Admin receives notification
3. Admin approves/rejects transaction
4. Automated processing to user wallet

## 🔧 Configuration

### Game Settings
All game parameters are configurable through the admin panel:

- Crop growth times and prices
- VIP tier benefits and pricing
- Contest schedules and rewards
- Water and booster limits
- Conversion rates

### Scheduled Tasks
- **Daily Reset** (00:00 UTC): Water refill, VIP rewards
- **Crop Monitoring** (Every 5 min): Harvest notifications
- **Contest Management** (Hourly): Winner selection
- **Data Cleanup** (Daily 02:00 UTC): Remove old records

## 🎵 Sound System

### Sound Categories
- **Farming Sounds**: Plant, water, harvest
- **UI Sounds**: Success, error, notification
- **Background Music**: Farm theme, menu music
- **Achievement Sounds**: Level up, coin earn

### User Controls
Users can toggle:
- Sound effects on/off
- Vibration feedback on/off  
- Background music on/off

## 🔒 Security Features

- **Input Validation**: All user inputs sanitized
- **Rate Limiting**: Prevent spam and abuse
- **Admin Authentication**: JWT-based admin panel security
- **Transaction Verification**: Multi-step payment approval
- **Referral Fraud Detection**: Prevent self-referrals

## 📈 Analytics & Monitoring

### Real-time Metrics
- Active users (daily/weekly/monthly)
- Total transactions and volume
- VIP subscription revenue
- Contest participation rates
- Task completion statistics

### Performance Monitoring
- Database query optimization
- Memory usage tracking
- Response time monitoring
- Error rate alerting

## 🚀 Deployment

### Production Setup
1. Use webhook instead of polling for Telegram
2. Set up SSL certificate for domain
3. Configure reverse proxy (nginx)
4. Set up database backups
5. Configure monitoring and logging

### Webhook Setup
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://yourdomain.com/webhook"}'
```

### Docker Deployment (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For technical support or questions:
- Create an issue on GitHub
- Contact: support@sbarofarmer.com
- Telegram: @SbaroFarmerSupport

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core farming mechanics
- ✅ VIP subscription system  
- ✅ Contest system
- ✅ Admin panel
- ✅ Payment integration

### Phase 2 (Coming Soon)
- 🔄 NFT crop varieties
- 🔄 Multiplayer co-op farms
- 🔄 Seasonal events
- 🔄 Mobile app version
- 🔄 Advanced analytics

### Phase 3 (Future)
- 🔄 Marketplace for trading crops
- 🔄 Guild system
- 🔄 PvP farming competitions
- 🔄 Cross-platform integration
- 🔄 AI-powered recommendations

---

**Happy Farming! 🌾**