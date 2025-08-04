const path = require('path');
const fs = require('fs');

class SoundManager {
  static SOUNDS = {
    welcome: '🎵',
    plant: '🌱',
    water_drop: '💧',
    harvest: '🌾',
    harvest_ready: '🔔',
    coin_earn: '💰',
    level_up: '🎉',
    error: '❌',
    success: '✅',
    notification: '🔔'
  };

  static SOUND_FILES = {
    welcome: 'sounds/welcome.mp3',
    plant: 'sounds/plant.mp3',
    water_drop: 'sounds/water.mp3',
    harvest: 'sounds/harvest.mp3',
    harvest_ready: 'sounds/notification.mp3',
    coin_earn: 'sounds/coin.mp3',
    level_up: 'sounds/levelup.mp3',
    error: 'sounds/error.mp3',
    success: 'sounds/success.mp3',
    notification: 'sounds/notification.mp3'
  };

  static async sendSound(bot, chatId, soundType) {
    try {
      // Check if user has sounds enabled
      // This would be checked from user preferences in a real implementation
      
      // For now, just send emoji feedback
      const soundIcon = this.SOUNDS[soundType] || '🔊';
      
      // In a real implementation, you could:
      // 1. Send audio files
      // 2. Use Telegram's built-in sounds
      // 3. Send animated stickers with sound
      
      // For demo purposes, we'll send a quick message that auto-deletes
      const soundMessage = await bot.sendMessage(chatId, soundIcon, {
        reply_markup: { remove_keyboard: true }
      });
      
      // Auto-delete the sound message after 2 seconds
      setTimeout(async () => {
        try {
          await bot.deleteMessage(chatId, soundMessage.message_id);
        } catch (error) {
          // Ignore deletion errors
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error sending sound:', error);
    }
  }

  static async sendAudio(bot, chatId, audioType) {
    try {
      const audioFile = this.SOUND_FILES[audioType];
      if (!audioFile) return;

      const audioPath = path.join(__dirname, '../../public', audioFile);
      
      // Check if audio file exists
      if (fs.existsSync(audioPath)) {
        await bot.sendAudio(chatId, audioPath, {
          duration: 3, // 3 seconds max for game sounds
          title: `SbaroFarmer - ${audioType}`,
          performer: 'SbaroFarmer Game'
        });
      } else {
        // Fallback to emoji
        await this.sendSound(bot, chatId, audioType);
      }
    } catch (error) {
      console.error('Error sending audio:', error);
      // Fallback to emoji
      await this.sendSound(bot, chatId, audioType);
    }
  }

  static async sendVibration(bot, chatId) {
    try {
      // Send a message that triggers phone vibration
      // This is a workaround since Telegram doesn't have direct vibration API
      await bot.sendMessage(chatId, '📳', {
        reply_markup: { remove_keyboard: true }
      });
    } catch (error) {
      console.error('Error sending vibration:', error);
    }
  }

  static createSoundButton(soundType, text, callbackData) {
    const soundIcon = this.SOUNDS[soundType] || '';
    return {
      text: `${soundIcon} ${text}`,
      callback_data: callbackData
    };
  }

  static async playBackgroundMusic(bot, chatId, musicType = 'farm') {
    try {
      const musicFiles = {
        farm: 'music/farm_background.mp3',
        menu: 'music/menu_background.mp3',
        victory: 'music/victory.mp3'
      };

      const musicFile = musicFiles[musicType];
      if (!musicFile) return;

      const musicPath = path.join(__dirname, '../../public', musicFile);
      
      if (fs.existsSync(musicPath)) {
        await bot.sendAudio(chatId, musicPath, {
          duration: 30, // 30 seconds background music
          title: `SbaroFarmer - ${musicType} theme`,
          performer: 'SbaroFarmer Game'
        });
      }
    } catch (error) {
      console.error('Error playing background music:', error);
    }
  }

  static getSoundSettings(user) {
    return {
      soundEnabled: user.soundEnabled || true,
      vibrationEnabled: user.vibrationEnabled || true,
      musicEnabled: user.musicEnabled || false
    };
  }

  static async updateSoundSettings(user, settings) {
    try {
      if (settings.soundEnabled !== undefined) {
        user.soundEnabled = settings.soundEnabled;
      }
      if (settings.vibrationEnabled !== undefined) {
        user.vibrationEnabled = settings.vibrationEnabled;
      }
      if (settings.musicEnabled !== undefined) {
        user.musicEnabled = settings.musicEnabled;
      }
      
      await user.save();
      return true;
    } catch (error) {
      console.error('Error updating sound settings:', error);
      return false;
    }
  }

  static createSoundSettingsKeyboard(user) {
    const settings = this.getSoundSettings(user);
    
    return [
      [
        {
          text: `🔊 Sounds: ${settings.soundEnabled ? '✅' : '❌'}`,
          callback_data: 'settings_toggle_sound'
        }
      ],
      [
        {
          text: `📳 Vibration: ${settings.vibrationEnabled ? '✅' : '❌'}`,
          callback_data: 'settings_toggle_vibration'
        }
      ],
      [
        {
          text: `🎵 Music: ${settings.musicEnabled ? '✅' : '❌'}`,
          callback_data: 'settings_toggle_music'
        }
      ],
      [
        {
          text: '↩️ Back',
          callback_data: 'profile_main'
        }
      ]
    ];
  }

  // Farming-specific sound helpers
  static async playPlantSound(bot, chatId, user) {
    if (user.soundEnabled) {
      await this.sendSound(bot, chatId, 'plant');
    }
  }

  static async playWaterSound(bot, chatId, user) {
    if (user.soundEnabled) {
      await this.sendSound(bot, chatId, 'water_drop');
    }
  }

  static async playHarvestSound(bot, chatId, user) {
    if (user.soundEnabled) {
      await this.sendSound(bot, chatId, 'harvest');
      if (user.vibrationEnabled) {
        await this.sendVibration(bot, chatId);
      }
    }
  }

  static async playCoinSound(bot, chatId, user) {
    if (user.soundEnabled) {
      await this.sendSound(bot, chatId, 'coin_earn');
    }
  }

  static async playLevelUpSound(bot, chatId, user) {
    if (user.soundEnabled) {
      await this.sendSound(bot, chatId, 'level_up');
      if (user.vibrationEnabled) {
        await this.sendVibration(bot, chatId);
      }
    }
  }

  static async playErrorSound(bot, chatId, user) {
    if (user.soundEnabled) {
      await this.sendSound(bot, chatId, 'error');
    }
  }

  static async playSuccessSound(bot, chatId, user) {
    if (user.soundEnabled) {
      await this.sendSound(bot, chatId, 'success');
    }
  }
}

module.exports = SoundManager;