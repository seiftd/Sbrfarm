module.exports = (sequelize, DataTypes) => {
  const MarketListing = sequelize.define('MarketListing', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    buyerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Item details
    itemType: {
      type: DataTypes.ENUM('crop', 'nft_crop', 'seed', 'booster', 'tool', 'patch_part'),
      allowNull: false
    },
    itemId: {
      type: DataTypes.STRING(100),
      allowNull: true // For NFTs or special items
    },
    cropType: {
      type: DataTypes.ENUM('potato', 'tomato', 'onion', 'carrot', 'wheat', 'corn'),
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    quality: {
      type: DataTypes.ENUM('poor', 'normal', 'good', 'excellent'),
      defaultValue: 'normal'
    },
    rarity: {
      type: DataTypes.ENUM('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'),
      allowNull: true
    },
    // Pricing
    pricePerUnit: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false
    },
    totalPrice: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false
    },
    currency: {
      type: DataTypes.ENUM('sbr_coin', 'usdt', 'ton', 'eth'),
      defaultValue: 'sbr_coin'
    },
    // Listing details
    listingType: {
      type: DataTypes.ENUM('fixed_price', 'auction', 'trade_offer'),
      defaultValue: 'fixed_price'
    },
    isNegotiable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    minimumOffer: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: true
    },
    // Auction specific
    auctionEndTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    highestBid: {
      type: DataTypes.DECIMAL(18, 8),
      defaultValue: 0
    },
    highestBidderId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    bidIncrement: {
      type: DataTypes.DECIMAL(18, 8),
      defaultValue: 1
    },
    reservePrice: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: true
    },
    // Trade offer specific
    wantedItems: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    // Status and timestamps
    status: {
      type: DataTypes.ENUM('active', 'sold', 'cancelled', 'expired'),
      defaultValue: 'active'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    soldAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Marketplace features
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isPromoted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    favoriteCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Fees and commissions
    platformFee: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 2.5 // 2.5%
    },
    guildBonus: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    // Additional info
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  }, {
    tableName: 'market_listings',
    timestamps: true,
    indexes: [
      { fields: ['sellerId'] },
      { fields: ['buyerId'] },
      { fields: ['itemType'] },
      { fields: ['cropType'] },
      { fields: ['status'] },
      { fields: ['listingType'] },
      { fields: ['currency'] },
      { fields: ['pricePerUnit'] },
      { fields: ['createdAt'] }
    ]
  });

  // Instance methods
  MarketListing.prototype.isActive = function() {
    const now = new Date();
    return this.status === 'active' && 
           (!this.expiresAt || this.expiresAt > now) &&
           (!this.auctionEndTime || this.auctionEndTime > now);
  };

  MarketListing.prototype.canBid = function(amount, userId) {
    if (this.listingType !== 'auction') {
      return { can: false, reason: 'Not an auction' };
    }

    if (!this.isActive()) {
      return { can: false, reason: 'Auction ended or listing inactive' };
    }

    if (userId === this.sellerId) {
      return { can: false, reason: 'Cannot bid on own item' };
    }

    if (amount <= this.highestBid) {
      return { can: false, reason: `Bid must be higher than ${this.highestBid}` };
    }

    if (amount < this.minimumOffer) {
      return { can: false, reason: `Bid must be at least ${this.minimumOffer}` };
    }

    return { can: true };
  };

  MarketListing.prototype.placeBid = function(amount, userId) {
    const canBid = this.canBid(amount, userId);
    if (!canBid.can) {
      return canBid;
    }

    this.highestBid = amount;
    this.highestBidderId = userId;
    
    // Extend auction if bid is placed in last 5 minutes
    if (this.auctionEndTime) {
      const timeLeft = this.auctionEndTime.getTime() - Date.now();
      if (timeLeft < 5 * 60 * 1000) { // 5 minutes
        this.auctionEndTime = new Date(Date.now() + 5 * 60 * 1000);
      }
    }

    return { can: true, newBid: amount };
  };

  MarketListing.prototype.buyNow = function(userId) {
    if (this.listingType !== 'fixed_price') {
      return { success: false, reason: 'Not a fixed price listing' };
    }

    if (!this.isActive()) {
      return { success: false, reason: 'Listing inactive' };
    }

    if (userId === this.sellerId) {
      return { success: false, reason: 'Cannot buy own item' };
    }

    this.buyerId = userId;
    this.status = 'sold';
    this.soldAt = new Date();

    return { success: true, price: this.totalPrice };
  };

  MarketListing.prototype.endAuction = function() {
    if (this.listingType !== 'auction') {
      return { success: false, reason: 'Not an auction' };
    }

    const now = new Date();
    if (this.auctionEndTime && now < this.auctionEndTime) {
      return { success: false, reason: 'Auction still active' };
    }

    if (this.highestBidderId && this.highestBid >= (this.reservePrice || 0)) {
      this.buyerId = this.highestBidderId;
      this.status = 'sold';
      this.soldAt = now;
      this.totalPrice = this.highestBid;
      return { success: true, winner: this.highestBidderId, price: this.highestBid };
    } else {
      this.status = 'expired';
      return { success: true, winner: null, reason: 'Reserve not met' };
    }
  };

  MarketListing.prototype.cancelListing = function(userId) {
    if (userId !== this.sellerId) {
      return { success: false, reason: 'Only seller can cancel' };
    }

    if (this.status !== 'active') {
      return { success: false, reason: 'Listing already inactive' };
    }

    if (this.listingType === 'auction' && this.highestBid > 0) {
      return { success: false, reason: 'Cannot cancel auction with bids' };
    }

    this.status = 'cancelled';
    return { success: true };
  };

  MarketListing.prototype.calculateFees = function() {
    const platformFeeAmount = (this.totalPrice * this.platformFee) / 100;
    const guildBonusAmount = (this.totalPrice * this.guildBonus) / 100;
    const sellerReceives = this.totalPrice - platformFeeAmount - guildBonusAmount;

    return {
      totalPrice: this.totalPrice,
      platformFee: platformFeeAmount,
      guildBonus: guildBonusAmount,
      sellerReceives: sellerReceives
    };
  };

  MarketListing.prototype.addToFavorites = function() {
    this.favoriteCount += 1;
  };

  MarketListing.prototype.incrementViews = function() {
    this.viewCount += 1;
  };

  MarketListing.prototype.getTimeRemaining = function() {
    if (!this.auctionEndTime) return null;
    
    const now = new Date();
    const remaining = this.auctionEndTime.getTime() - now.getTime();
    
    if (remaining <= 0) return { expired: true };
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes, expired: false };
  };

  MarketListing.prototype.getDisplayPrice = function() {
    const currencySymbols = {
      sbr_coin: 'SBR',
      usdt: 'USDT',
      ton: 'TON',
      eth: 'ETH'
    };

    const symbol = currencySymbols[this.currency] || this.currency.toUpperCase();
    
    if (this.listingType === 'auction') {
      return `Starting at ${this.pricePerUnit} ${symbol}`;
    } else {
      return `${this.totalPrice} ${symbol}`;
    }
  };

  // Static methods
  MarketListing.getMarketStats = async function() {
    const [
      totalListings,
      activeListings,
      completedSales,
      totalVolume
    ] = await Promise.all([
      this.count(),
      this.count({ where: { status: 'active' } }),
      this.count({ where: { status: 'sold' } }),
      this.sum('totalPrice', { where: { status: 'sold' } })
    ]);

    return {
      totalListings,
      activeListings,
      completedSales,
      totalVolume: totalVolume || 0
    };
  };

  return MarketListing;
};