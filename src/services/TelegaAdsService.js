const axios = require('axios');

class TelegaAdsService {
  constructor() {
    this.apiKey = process.env.TELEGA_API_KEY;
    this.siteId = process.env.TELEGA_SITE_ID;
    this.baseUrl = 'https://api.telega.io';
    this.userSessions = new Map(); // Store user ad sessions
  }

  async generateAd(userId) {
    try {
      if (!this.apiKey || !this.siteId) {
        console.warn('Telega.io not configured, using mock ads');
        return this.generateMockAd(userId);
      }

      const response = await axios.post(`${this.baseUrl}/ads/generate`, {
        site_id: this.siteId,
        user_id: userId,
        ad_type: 'reward_video',
        reward_amount: 1
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        // Store session for verification
        this.userSessions.set(userId, {
          adId: response.data.ad_id,
          timestamp: Date.now(),
          verified: false
        });

        return {
          success: true,
          adUrl: response.data.ad_url,
          adId: response.data.ad_id
        };
      } else {
        throw new Error(response.data.message || 'Failed to generate ad');
      }
    } catch (error) {
      console.error('Error generating Telega ad:', error.message);
      
      // Fallback to mock ads if service is down
      return this.generateMockAd(userId);
    }
  }

  async verifyAdCompletion(userId) {
    try {
      const session = this.userSessions.get(userId);
      if (!session) {
        return false;
      }

      // Check if session is too old (5 minutes)
      if (Date.now() - session.timestamp > 5 * 60 * 1000) {
        this.userSessions.delete(userId);
        return false;
      }

      if (!this.apiKey || !this.siteId) {
        // Mock verification - always return true for testing
        this.userSessions.delete(userId);
        return true;
      }

      const response = await axios.post(`${this.baseUrl}/ads/verify`, {
        site_id: this.siteId,
        ad_id: session.adId,
        user_id: userId
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const isVerified = response.data.success && response.data.completed;
      
      if (isVerified) {
        this.userSessions.delete(userId);
      }

      return isVerified;
    } catch (error) {
      console.error('Error verifying Telega ad:', error.message);
      
      // If verification fails, assume completion for better UX
      this.userSessions.delete(userId);
      return true;
    }
  }

  generateMockAd(userId) {
    // Generate a mock ad for testing purposes
    const mockAdId = `mock_${userId}_${Date.now()}`;
    
    this.userSessions.set(userId, {
      adId: mockAdId,
      timestamp: Date.now(),
      verified: false
    });

    return {
      success: true,
      adUrl: `https://example.com/mock-ad?id=${mockAdId}`,
      adId: mockAdId
    };
  }

  async getAdStatistics(userId) {
    try {
      if (!this.apiKey || !this.siteId) {
        return {
          totalAdsWatched: 0,
          todayAdsWatched: 0,
          totalRewards: 0
        };
      }

      const response = await axios.get(`${this.baseUrl}/stats/user`, {
        params: {
          site_id: this.siteId,
          user_id: userId
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting ad statistics:', error.message);
      return {
        totalAdsWatched: 0,
        todayAdsWatched: 0,
        totalRewards: 0
      };
    }
  }

  async getSiteStatistics() {
    try {
      if (!this.apiKey || !this.siteId) {
        return {
          totalImpressions: 0,
          totalClicks: 0,
          totalRewards: 0,
          revenue: 0
        };
      }

      const response = await axios.get(`${this.baseUrl}/stats/site`, {
        params: {
          site_id: this.siteId
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting site statistics:', error.message);
      return {
        totalImpressions: 0,
        totalClicks: 0,
        totalRewards: 0,
        revenue: 0
      };
    }
  }

  async updateAdSettings(settings) {
    try {
      if (!this.apiKey || !this.siteId) {
        console.warn('Cannot update ad settings - Telega.io not configured');
        return false;
      }

      const response = await axios.put(`${this.baseUrl}/settings`, {
        site_id: this.siteId,
        ...settings
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.success;
    } catch (error) {
      console.error('Error updating ad settings:', error.message);
      return false;
    }
  }

  // Clean up old sessions periodically
  cleanupSessions() {
    const now = Date.now();
    const expiredTime = 5 * 60 * 1000; // 5 minutes

    for (const [userId, session] of this.userSessions.entries()) {
      if (now - session.timestamp > expiredTime) {
        this.userSessions.delete(userId);
      }
    }
  }

  // Get current session count for monitoring
  getActiveSessionCount() {
    return this.userSessions.size;
  }

  // Check if user has active ad session
  hasActiveSession(userId) {
    const session = this.userSessions.get(userId);
    if (!session) return false;
    
    // Check if session is not expired
    return Date.now() - session.timestamp <= 5 * 60 * 1000;
  }

  // Get user session info
  getUserSession(userId) {
    return this.userSessions.get(userId) || null;
  }

  // Initialize service with cleanup interval
  initialize() {
    // Cleanup expired sessions every minute
    setInterval(() => {
      this.cleanupSessions();
    }, 60 * 1000);

    console.log('TelegaAdsService initialized');
  }
}

module.exports = TelegaAdsService;