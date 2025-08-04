# 🚀 SBAROFARMER - Quick Start Guide

Get your SBAROFARMER Telegram game up and running in 10 minutes!

## ⚡ Quick Setup

### 1. Prerequisites
- Node.js 16+ installed
- MySQL 8.0+ running
- Telegram Bot Token from [@BotFather](https://t.me/botfather)

### 2. Download & Install
```bash
# Clone the repository
git clone <your-repo-url>
cd sbarofarmer-telegram-game

# Install dependencies
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

### 4. Configure Environment
Edit `.env` file with your details:

```env
# REQUIRED - Get from @BotFather
TELEGRAM_BOT_TOKEN=1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# Database (Update with your MySQL credentials)
DB_HOST=localhost
DB_NAME=sbarofarmer
DB_USER=root
DB_PASSWORD=your_mysql_password

# Admin Panel
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_JWT_SECRET=your_32_character_secret_key_here

# OPTIONAL - For production features
TELEGA_API_KEY=your_telega_api_key
BINANCE_PAY_API_KEY=your_binance_key
TON_WALLET_API=your_ton_api_key
```

### 5. Start the Game
```bash
# Development mode (with auto-restart)
npm run dev

# OR Production mode
npm start
```

Your bot is now running! 🎉

## 🎮 Test Your Bot

1. Open Telegram
2. Search for your bot (@yourbotname)
3. Send `/start` to begin farming!

## 🛠️ Development Mode

### File Structure
```
src/
├── index.js              # Main bot entry point
├── database/
│   └── models/           # Database models
├── services/             # Business logic services
├── bot/
│   ├── handlers/         # Command & callback handlers
│   └── utils/           # Bot utilities & icons
└── admin/               # Admin panel (if implemented)
```

### Key Features Ready to Test

#### ✅ Core Farming
- Plant seeds in patches
- Water crops
- Harvest when ready
- Earn SBR coins

#### ✅ Inventory System
- `/bag` - View inventory
- Water drops, seeds, boosters
- Patch parts for expansion

#### ✅ Shop System
- `/shop` - Buy/sell interface
- Two categories: Buy & Sell
- Crop marketplace

#### ✅ VIP System
- `/vip` - VIP subscription tiers
- Daily rewards & benefits
- Extra farm patches

#### ✅ Contest System
- `/contests` - Daily/weekly/monthly
- Automatic winner selection
- Prize distribution

#### ✅ Task System
- `/tasks` - Daily challenges
- Achievement tracking
- Reward claiming

#### ✅ Ad Integration
- Watch ads for water
- 1-minute cooldown
- Telega.io integration (mock mode by default)

## 🔧 Configuration

### Game Settings
Edit these values in `.env`:

```env
# Maximum inventory limits
MAX_WATER_DROPS=100
MAX_BOOSTERS=10
MAX_HEAVY_WATER=5

# Conversion rates
CONVERSION_RATE_SBR_TO_USDT=200
CONVERSION_RATE_WATER_TO_HEAVY=100
CONVERSION_RATE_HEAVY_TO_SBR=2
```

### Crop Growth Times
Default times (configurable in database):
- 🥔 Potato: 24 hours
- 🍅 Tomato: 48 hours  
- 🧅 Onion: 96 hours
- 🥕 Carrot: 144 hours

## 🐛 Troubleshooting

### Common Issues

#### "Database connection failed"
```bash
# Check MySQL is running
sudo systemctl status mysql

# Verify credentials in .env
mysql -u root -p
```

#### "Bot not responding"
```bash
# Check bot token is correct
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getMe"

# Verify bot is running
npm run dev
```

#### "Tables don't exist"
```bash
# Database will auto-sync on first run
# If issues persist, manually sync:
npm run migrate
```

### Enable Debug Mode
```bash
# Add to .env
NODE_ENV=development
DEBUG=true
```

## 🚀 Production Deployment

### 1. Use Webhooks (Recommended)
```bash
# Set webhook URL
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://yourdomain.com/webhook"}'
```

### 2. Environment Setup
```env
NODE_ENV=production
PORT=3000
WEBHOOK_URL=https://yourdomain.com/webhook
```

### 3. Process Management
```bash
# Using PM2
npm install -g pm2
pm2 start src/index.js --name "sbarofarmer"
pm2 save
pm2 startup
```

## 📊 Monitoring

### Check Bot Status
```bash
# View logs
tail -f logs/bot.log

# Check database
mysql -u root -p sbarofarmer
SELECT COUNT(*) FROM users;
```

### Performance Metrics
- Active users: Available in bot logs
- Database size: Monitor with MySQL tools
- Memory usage: `ps aux | grep node`

## 🔐 Security Checklist

- [ ] Strong MySQL password
- [ ] Secure admin JWT secret (32+ characters)
- [ ] HTTPS for webhooks (production)
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] Backup strategy in place

## 🆘 Need Help?

### Quick Commands
```bash
npm run dev          # Start development
npm run admin        # Start admin panel
npm test            # Run tests (if available)
npm run migrate     # Sync database
```

### Support Resources
- Check console logs for errors
- Verify all environment variables
- Test database connection
- Validate bot token

## 🎯 Next Steps

1. **Customize Game**: Modify crop types, growth times, rewards
2. **Add Features**: Implement new game mechanics
3. **Admin Panel**: Build web interface for management
4. **Payment Integration**: Add real payment processing
5. **Scaling**: Implement caching, load balancing

## 📝 Development Tips

### Adding New Crops
1. Update crop enum in `Crop.js` model
2. Add crop data in `getCropData()` function
3. Add icon in `GameIcons.js`
4. Update shop prices

### Creating New Tasks
1. Add task in `Task.js` model
2. Update `TaskService.js` for progress tracking
3. Create task handler in bot

### Modifying VIP Tiers
1. Update `VipSubscription.js` benefits
2. Adjust pricing in `getTierBenefits()`
3. Update bot VIP display

Happy Farming! 🌾🚜

---

**Pro Tip**: Start with the basic features, then gradually add payment integration and advanced features as your game grows!