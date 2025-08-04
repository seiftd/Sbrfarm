const db = require('../database/models');

class AiRecommendationService {
  constructor() {
    this.userProfiles = new Map();
    this.marketTrends = new Map();
    this.seasonalPatterns = new Map();
    this.learningData = {
      userBehaviors: [],
      successPatterns: [],
      marketData: []
    };
  }

  // User Profiling and Analysis
  async analyzeUserProfile(userId) {
    try {
      const user = await db.User.findByPk(userId, {
        include: [
          { model: db.Patch, include: [db.Crop] },
          { model: db.Transaction },
          { model: db.UserTask },
          { model: db.VipSubscription }
        ]
      });

      if (!user) return null;

      const profile = {
        userId,
        farmingStyle: this.determineFarmingStyle(user),
        playTime: this.analyzePlayTime(user),
        riskTolerance: this.assessRiskTolerance(user),
        preferences: this.extractPreferences(user),
        skillLevel: this.calculateSkillLevel(user),
        goals: this.identifyGoals(user),
        weaknesses: this.identifyWeaknesses(user),
        lastAnalysis: new Date()
      };

      this.userProfiles.set(userId, profile);
      return profile;
    } catch (error) {
      console.error('Error analyzing user profile:', error);
      return null;
    }
  }

  determineFarmingStyle(user) {
    const patches = user.Patches || [];
    const crops = patches.flatMap(p => p.Crops || []);
    const transactions = user.Transactions || [];

    // Analyze crop diversity
    const cropTypes = [...new Set(crops.map(c => c.cropType))];
    const diversity = cropTypes.length;

    // Analyze trading behavior
    const trades = transactions.filter(t => t.type === 'sell');
    const tradingFrequency = trades.length;

    // Analyze investment patterns
    const investments = transactions.filter(t => t.type === 'purchase');
    const investmentAmount = investments.reduce((sum, t) => sum + t.amount, 0);

    if (diversity >= 3 && tradingFrequency > 20) {
      return 'diversified_trader';
    } else if (investmentAmount > 1000 && tradingFrequency < 10) {
      return 'long_term_investor';
    } else if (tradingFrequency > 30) {
      return 'active_trader';
    } else if (diversity <= 2) {
      return 'specialist';
    } else {
      return 'balanced';
    }
  }

  analyzePlayTime(user) {
    const now = new Date();
    const accountAge = now - new Date(user.createdAt);
    const daysActive = Math.floor(accountAge / (1000 * 60 * 60 * 24));
    
    // Estimate sessions based on login patterns
    const estimatedSessions = user.totalHarvests * 0.3; // Rough estimate
    const avgSessionLength = daysActive > 0 ? estimatedSessions / daysActive : 0;

    return {
      totalDays: daysActive,
      estimatedSessions,
      avgSessionLength,
      intensity: avgSessionLength > 2 ? 'high' : avgSessionLength > 1 ? 'medium' : 'low'
    };
  }

  assessRiskTolerance(user) {
    const transactions = user.Transactions || [];
    const totalSpent = transactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balanceRatio = totalSpent / (user.sbrCoin + 1);
    const vipStatus = user.VipSubscriptions?.length > 0;

    if (balanceRatio > 0.8 || vipStatus) {
      return 'high';
    } else if (balanceRatio > 0.4) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  extractPreferences(user) {
    const patches = user.Patches || [];
    const crops = patches.flatMap(p => p.Crops || []);
    
    // Favorite crops
    const cropCounts = {};
    crops.forEach(crop => {
      cropCounts[crop.cropType] = (cropCounts[crop.cropType] || 0) + 1;
    });
    
    const favoriteCrops = Object.entries(cropCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([crop]) => crop);

    return {
      favoriteCrops,
      prefersVip: user.VipSubscriptions?.length > 0,
      activeInContests: user.UserTasks?.some(ut => ut.Task?.type === 'contest') || false
    };
  }

  calculateSkillLevel(user) {
    const factors = {
      totalHarvests: user.totalHarvests || 0,
      efficiency: user.totalValue / Math.max(user.totalHarvests, 1),
      diversification: new Set(user.Patches?.flatMap(p => p.Crops?.map(c => c.cropType)) || []).size,
      experience: Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))
    };

    let score = 0;
    score += Math.min(factors.totalHarvests / 10, 25); // Max 25 points
    score += Math.min(factors.efficiency / 10, 25); // Max 25 points
    score += Math.min(factors.diversification * 5, 25); // Max 25 points
    score += Math.min(factors.experience / 7, 25); // Max 25 points

    if (score >= 80) return 'expert';
    if (score >= 60) return 'advanced';
    if (score >= 40) return 'intermediate';
    if (score >= 20) return 'beginner';
    return 'novice';
  }

  // Recommendation Generation
  async generateRecommendations(userId) {
    const profile = await this.analyzeUserProfile(userId);
    if (!profile) return [];

    const recommendations = [];

    // Crop recommendations
    recommendations.push(...this.getCropRecommendations(profile));
    
    // Strategy recommendations
    recommendations.push(...this.getStrategyRecommendations(profile));
    
    // Market timing recommendations
    recommendations.push(...this.getMarketRecommendations(profile));
    
    // Optimization recommendations
    recommendations.push(...this.getOptimizationRecommendations(profile));

    // VIP recommendations
    recommendations.push(...this.getVipRecommendations(profile));

    return this.prioritizeRecommendations(recommendations, profile);
  }

  getCropRecommendations(profile) {
    const recommendations = [];
    const currentSeason = this.getCurrentSeason();
    
    // Seasonal crop suggestions
    const seasonalCrops = this.getSeasonalCrops(currentSeason);
    if (seasonalCrops.length > 0) {
      recommendations.push({
        type: 'crop_seasonal',
        priority: 'high',
        title: `Plant ${currentSeason} crops for bonus yields`,
        description: `${seasonalCrops.join(', ')} are giving 20% bonus this season`,
        action: 'plant_seasonal_crops',
        data: { crops: seasonalCrops },
        confidence: 0.9
      });
    }

    // Diversification suggestions
    if (profile.preferences.favoriteCrops.length < 3) {
      const suggestedCrops = this.getSuggestedCrops(profile);
      recommendations.push({
        type: 'crop_diversification',
        priority: 'medium',
        title: 'Diversify your crops for better returns',
        description: `Try growing ${suggestedCrops.join(', ')} to reduce risk`,
        action: 'diversify_crops',
        data: { crops: suggestedCrops },
        confidence: 0.7
      });
    }

    // High-value crop opportunities
    const profitableCrops = this.getProfitableCrops(profile);
    if (profitableCrops.length > 0) {
      recommendations.push({
        type: 'crop_profitable',
        priority: 'high',
        title: 'High-profit crops available',
        description: `${profitableCrops[0]} is currently 30% more profitable`,
        action: 'plant_profitable_crop',
        data: { crop: profitableCrops[0] },
        confidence: 0.8
      });
    }

    return recommendations;
  }

  getStrategyRecommendations(profile) {
    const recommendations = [];

    switch (profile.farmingStyle) {
      case 'active_trader':
        recommendations.push({
          type: 'strategy_trading',
          priority: 'high',
          title: 'Optimize your trading times',
          description: 'Market is most active between 18:00-22:00 UTC',
          action: 'schedule_trading',
          data: { optimalHours: [18, 19, 20, 21] },
          confidence: 0.85
        });
        break;

      case 'long_term_investor':
        recommendations.push({
          type: 'strategy_investment',
          priority: 'medium',
          title: 'Consider NFT crops for long-term gains',
          description: 'NFT crops appreciate in value over time',
          action: 'explore_nft_crops',
          confidence: 0.75
        });
        break;

      case 'specialist':
        recommendations.push({
          type: 'strategy_specialization',
          priority: 'medium',
          title: 'Master your specialty for bonus rewards',
          description: `Become an expert ${profile.preferences.favoriteCrops[0]} farmer`,
          action: 'specialize_further',
          data: { crop: profile.preferences.favoriteCrops[0] },
          confidence: 0.8
        });
        break;
    }

    return recommendations;
  }

  getMarketRecommendations(profile) {
    const recommendations = [];
    
    // Market timing based on AI analysis
    const marketTrend = this.analyzeMarketTrend();
    
    if (marketTrend.direction === 'bullish') {
      recommendations.push({
        type: 'market_timing',
        priority: 'high',
        title: 'Great time to sell crops',
        description: `Market prices are ${marketTrend.strength}% above average`,
        action: 'sell_crops_now',
        confidence: marketTrend.confidence
      });
    } else if (marketTrend.direction === 'bearish') {
      recommendations.push({
        type: 'market_timing',
        priority: 'medium',
        title: 'Hold crops for better prices',
        description: 'Market expected to recover in 2-3 days',
        action: 'wait_to_sell',
        confidence: marketTrend.confidence
      });
    }

    return recommendations;
  }

  getOptimizationRecommendations(profile) {
    const recommendations = [];

    // Farm efficiency improvements
    if (profile.skillLevel === 'beginner' || profile.skillLevel === 'novice') {
      recommendations.push({
        type: 'optimization_basic',
        priority: 'high',
        title: 'Improve your farming efficiency',
        description: 'Water crops immediately after planting for 15% faster growth',
        action: 'learn_efficient_watering',
        confidence: 0.95
      });
    }

    // Advanced optimizations
    if (profile.skillLevel === 'advanced' || profile.skillLevel === 'expert') {
      recommendations.push({
        type: 'optimization_advanced',
        priority: 'medium',
        title: 'Try crop rotation strategy',
        description: 'Rotating crop types can increase soil fertility by 25%',
        action: 'implement_crop_rotation',
        confidence: 0.8
      });
    }

    return recommendations;
  }

  getVipRecommendations(profile) {
    const recommendations = [];

    if (!profile.preferences.prefersVip && profile.riskTolerance === 'high') {
      const vipBenefits = this.calculateVipRoi(profile);
      if (vipBenefits.roi > 1.2) {
        recommendations.push({
          type: 'vip_suggestion',
          priority: 'medium',
          title: 'VIP membership could boost your profits',
          description: `Estimated ${Math.round((vipBenefits.roi - 1) * 100)}% return on VIP investment`,
          action: 'consider_vip',
          data: { roi: vipBenefits.roi },
          confidence: 0.7
        });
      }
    }

    return recommendations;
  }

  // AI Learning and Pattern Recognition
  async learnFromUserBehavior(userId, action, outcome) {
    const behaviorData = {
      userId,
      action,
      outcome,
      timestamp: new Date(),
      context: await this.getUserContext(userId)
    };

    this.learningData.userBehaviors.push(behaviorData);

    // Pattern recognition
    this.updatePatterns(behaviorData);
    
    // Update user profile
    if (this.userProfiles.has(userId)) {
      await this.analyzeUserProfile(userId); // Refresh profile
    }
  }

  updatePatterns(behaviorData) {
    // Success pattern analysis
    if (behaviorData.outcome.success) {
      const pattern = {
        action: behaviorData.action,
        context: behaviorData.context,
        successRate: 1,
        sampleSize: 1
      };

      const existingPattern = this.learningData.successPatterns.find(
        p => p.action === pattern.action && 
            JSON.stringify(p.context) === JSON.stringify(pattern.context)
      );

      if (existingPattern) {
        existingPattern.successRate = 
          (existingPattern.successRate * existingPattern.sampleSize + 1) / 
          (existingPattern.sampleSize + 1);
        existingPattern.sampleSize += 1;
      } else {
        this.learningData.successPatterns.push(pattern);
      }
    }
  }

  // Market Analysis
  analyzeMarketTrend() {
    // Simulated market analysis
    const trends = ['bullish', 'bearish', 'stable'];
    const trend = trends[Math.floor(Math.random() * trends.length)];
    
    return {
      direction: trend,
      strength: Math.floor(Math.random() * 20) + 5, // 5-25%
      confidence: 0.6 + Math.random() * 0.3 // 0.6-0.9
    };
  }

  // Helper Methods
  getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  getSeasonalCrops(season) {
    const seasonalCrops = {
      spring: ['potato', 'fresh_herbs'],
      summer: ['tomato', 'corn'],
      autumn: ['onion', 'wheat'],
      winter: ['carrot', 'winter_berries']
    };
    return seasonalCrops[season] || [];
  }

  getSuggestedCrops(profile) {
    const allCrops = ['potato', 'tomato', 'onion', 'carrot', 'wheat', 'corn'];
    const favoriteCrops = profile.preferences.favoriteCrops;
    return allCrops.filter(crop => !favoriteCrops.includes(crop)).slice(0, 2);
  }

  getProfitableCrops(profile) {
    // Simulated profitable crop analysis
    const crops = ['tomato', 'carrot', 'wheat', 'corn'];
    return crops.sort(() => Math.random() - 0.5).slice(0, 2);
  }

  calculateVipRoi(profile) {
    // Calculate potential ROI based on user's farming activity
    const baseActivity = profile.playTime.intensity === 'high' ? 1.5 : 
                         profile.playTime.intensity === 'medium' ? 1.2 : 1.0;
    
    const roi = baseActivity + (Math.random() * 0.3); // Add some variance
    return { roi };
  }

  prioritizeRecommendations(recommendations, profile) {
    // Sort recommendations by priority and confidence
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      })
      .slice(0, 5); // Return top 5 recommendations
  }

  async getUserContext(userId) {
    const user = await db.User.findByPk(userId);
    return {
      level: user?.level || 1,
      sbrCoin: user?.sbrCoin || 0,
      waterDrops: user?.waterDrops || 0,
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay()
    };
  }

  // Personalized Tips
  async getPersonalizedTips(userId) {
    const profile = this.userProfiles.get(userId);
    if (!profile) return [];

    const tips = [];

    // Skill-based tips
    switch (profile.skillLevel) {
      case 'novice':
      case 'beginner':
        tips.push({
          category: 'basics',
          tip: 'Always water your crops right after planting for faster growth',
          importance: 'high'
        });
        break;
      
      case 'intermediate':
        tips.push({
          category: 'strategy',
          tip: 'Try growing different crop types to spread risk',
          importance: 'medium'
        });
        break;
      
      case 'advanced':
      case 'expert':
        tips.push({
          category: 'optimization',
          tip: 'Monitor market trends to maximize selling profits',
          importance: 'high'
        });
        break;
    }

    // Personalized based on farming style
    if (profile.farmingStyle === 'active_trader') {
      tips.push({
        category: 'trading',
        tip: 'Check the marketplace during peak hours for better deals',
        importance: 'high'
      });
    }

    return tips;
  }

  // Performance Predictions
  async predictUserPerformance(userId, timeframe = 'week') {
    const profile = this.userProfiles.get(userId);
    if (!profile) return null;

    const baseProductivity = this.calculateBaseProductivity(profile);
    const seasonalModifier = this.getSeasonalModifier();
    const trendModifier = this.getTrendModifier(profile);

    const prediction = {
      timeframe,
      expectedHarvests: Math.round(baseProductivity * seasonalModifier * trendModifier),
      expectedRevenue: Math.round(baseProductivity * seasonalModifier * trendModifier * 150),
      confidence: 0.75,
      factors: {
        skillLevel: profile.skillLevel,
        farmingStyle: profile.farmingStyle,
        seasonalBonus: seasonalModifier > 1,
        marketTrend: trendModifier > 1 ? 'positive' : 'negative'
      }
    };

    return prediction;
  }

  calculateBaseProductivity(profile) {
    const skillMultipliers = {
      novice: 1.0,
      beginner: 1.2,
      intermediate: 1.5,
      advanced: 1.8,
      expert: 2.2
    };

    const intensityMultipliers = {
      low: 1.0,
      medium: 1.3,
      high: 1.6
    };

    return 10 * // Base harvests per week
           skillMultipliers[profile.skillLevel] * 
           intensityMultipliers[profile.playTime.intensity];
  }

  getSeasonalModifier() {
    // Simulate seasonal effects
    return 0.8 + Math.random() * 0.4; // 0.8 to 1.2
  }

  getTrendModifier(profile) {
    // Simulate trend effects based on profile
    return 0.9 + Math.random() * 0.2; // 0.9 to 1.1
  }
}

module.exports = AiRecommendationService;