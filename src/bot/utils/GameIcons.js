class GameIcons {
  static CROPS = {
    potato: '🥔',
    tomato: '🍅',
    onion: '🧅',
    carrot: '🥕'
  };

  static ITEMS = {
    water: '💧',
    heavyWater: '🌊',
    booster: '⚡',
    sbrCoin: '💰',
    usdt: '💵',
    ton: '💎'
  };

  static FARMING = {
    patch: '🏞️',
    farm: '🌾',
    harvest: '🌿',
    plant: '🌱',
    watering: '🚿',
    fertilizer: '🧪',
    greenhouse: '🏠',
    sprinkler: '💦'
  };

  static VIP = {
    tier1: '🥉',
    tier2: '🥈',
    tier3: '🥇',
    tier4: '👑',
    crown: '👑',
    star: '⭐',
    diamond: '💎'
  };

  static INTERFACE = {
    back: '↩️',
    next: '➡️',
    prev: '⬅️',
    refresh: '🔄',
    settings: '⚙️',
    close: '❌',
    check: '✅',
    warning: '⚠️',
    info: 'ℹ️',
    success: '🎉',
    error: '❌'
  };

  static SHOP = {
    buy: '🛒',
    sell: '💱',
    cart: '🛍️',
    money: '💰',
    price: '🏷️'
  };

  static CONTEST = {
    trophy: '🏆',
    medal: '🏅',
    winner: '🥇',
    participant: '👤',
    prize: '🎁'
  };

  static TASKS = {
    daily: '📅',
    weekly: '📊',
    achievement: '🏆',
    completed: '✅',
    pending: '⏳',
    reward: '🎁'
  };

  static ADMIN = {
    admin: '👨‍💼',
    stats: '📊',
    users: '👥',
    ban: '🚫',
    approve: '✅',
    reject: '❌',
    edit: '✏️'
  };

  static SOUNDS = {
    notification: '🔔',
    music: '🎵',
    sound: '🔊',
    mute: '🔇'
  };

  // Helper methods
  static getCropIcon(cropType) {
    return this.CROPS[cropType] || '🌱';
  }

  static getVipIcon(tier) {
    const icons = {
      1: this.VIP.tier1,
      2: this.VIP.tier2,
      3: this.VIP.tier3,
      4: this.VIP.tier4
    };
    return icons[tier] || this.VIP.star;
  }

  static getGrowthStageIcon(stage) {
    const stages = {
      1: '🌱', // Seed
      2: '🌿', // Sprout
      3: '🌾', // Growing
      4: '✨'  // Ready
    };
    return stages[stage] || '🌱';
  }

  static getProgressBar(percentage, length = 10) {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return '🟩'.repeat(filled) + '⬜'.repeat(empty);
  }

  static formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  static formatNumber(number) {
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + 'M';
    } else if (number >= 1000) {
      return (number / 1000).toFixed(1) + 'K';
    }
    return number.toString();
  }

  static getQualityIcon(quality) {
    const qualities = {
      poor: '🔴',
      normal: '🟡',
      good: '🟢',
      excellent: '🟣'
    };
    return qualities[quality] || '🟡';
  }

  static getWeatherIcon() {
    const weather = ['☀️', '⛅', '🌤️', '🌦️', '🌈'];
    return weather[Math.floor(Math.random() * weather.length)];
  }

  static createFarmDisplay(patches) {
    let display = '🌾 **Your Farm** 🌾\n\n';
    
    for (let i = 0; i < patches.length; i++) {
      const patch = patches[i];
      const row = Math.floor(i / 3);
      const col = i % 3;
      
      if (col === 0) display += '\n';
      
      if (patch.currentCrop) {
        display += this.getCropIcon(patch.currentCrop.cropType);
      } else {
        display += '🏞️';
      }
      
      display += ' ';
    }
    
    return display;
  }

  static createInventoryDisplay(user) {
    return `
🎒 **Your Inventory** 🎒

💰 SBR Coins: ${this.formatNumber(user.sbrCoin)}
💵 USDT: ${user.usdtBalance}
💎 TON: ${user.tonBalance}

💧 Water Drops: ${user.waterDrops}/100
🌊 Heavy Water: ${user.heavyWaterDrops}/5
⚡ Boosters: ${user.boosters}/10

🌱 **Seeds:**
🥔 Potato: ${user.potatoSeeds}
🍅 Tomato: ${user.tomatoSeeds}
🧅 Onion: ${user.onionSeeds}
🥕 Carrot: ${user.carrotSeeds}

🔧 Patch Parts: ${user.patchParts}/10
    `;
  }
}

module.exports = GameIcons;