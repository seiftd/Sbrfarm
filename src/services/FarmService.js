const db = require('../database/models');

class FarmService {
  async createInitialPatches(userId) {
    try {
      const patches = [];
      for (let i = 1; i <= 3; i++) {
        patches.push({
          userId,
          patchNumber: i,
          isActive: true
        });
      }
      
      return await db.Patch.bulkCreate(patches);
    } catch (error) {
      console.error('Error creating initial patches:', error);
      throw error;
    }
  }

  async getUserFarm(userId) {
    try {
      const patches = await db.Patch.findAll({
        where: { userId },
        include: [
          {
            model: db.Crop,
            as: 'crops',
            where: { isHarvested: false },
            required: false
          }
        ],
        order: [['patchNumber', 'ASC']]
      });

      return patches.map(patch => ({
        ...patch.toJSON(),
        currentCrop: patch.crops && patch.crops.length > 0 ? patch.crops[0] : null
      }));
    } catch (error) {
      console.error('Error getting user farm:', error);
      throw error;
    }
  }

  async plantCrop(userId, patchId, cropType) {
    try {
      const user = await db.User.findByPk(userId);
      const patch = await db.Patch.findOne({
        where: { id: patchId, userId }
      });

      if (!user || !patch) {
        throw new Error('User or patch not found');
      }

      // Check if patch is available
      const existingCrop = await db.Crop.findOne({
        where: { patchId, isHarvested: false }
      });

      if (existingCrop) {
        throw new Error('Patch already has a crop');
      }

      // Check if user has seeds
      const seedField = `${cropType}Seeds`;
      if (user[seedField] <= 0) {
        throw new Error('No seeds available');
      }

      // Create crop
      const crop = await db.Crop.create({
        userId,
        patchId,
        cropType
      });

      // Deduct seed from user
      user[seedField] -= 1;
      await user.save();

      return crop;
    } catch (error) {
      console.error('Error planting crop:', error);
      throw error;
    }
  }

  async waterCrop(userId, cropId, waterType = 'regular') {
    try {
      const user = await db.User.findByPk(userId);
      const crop = await db.Crop.findOne({
        where: { id: cropId, userId, isHarvested: false }
      });

      if (!user || !crop) {
        throw new Error('User or crop not found');
      }

      if (crop.isWatered) {
        throw new Error('Crop already watered');
      }

      let waterCost = crop.waterRequired;
      let waterField = 'waterDrops';

      if (waterType === 'heavy') {
        if (crop.waterRequired >= 100) {
          waterCost = 1;
          waterField = 'heavyWaterDrops';
        } else {
          throw new Error('Heavy water not suitable for this crop');
        }
      }

      if (user[waterField] < waterCost) {
        throw new Error('Not enough water');
      }

      // Water the crop
      crop.water();
      await crop.save();

      // Deduct water from user
      user[waterField] -= waterCost;
      await user.save();

      return crop;
    } catch (error) {
      console.error('Error watering crop:', error);
      throw error;
    }
  }

  async useBooster(userId, cropId) {
    try {
      const user = await db.User.findByPk(userId);
      const crop = await db.Crop.findOne({
        where: { id: cropId, userId, isHarvested: false }
      });

      if (!user || !crop) {
        throw new Error('User or crop not found');
      }

      if (user.boosters <= 0) {
        throw new Error('No boosters available');
      }

      if (!crop.canUseBooster()) {
        throw new Error('Cannot use more boosters on this crop');
      }

      // Use booster
      crop.useBooster();
      await crop.save();

      // Deduct booster from user
      user.boosters -= 1;
      await user.save();

      return crop;
    } catch (error) {
      console.error('Error using booster:', error);
      throw error;
    }
  }

  async harvestCrop(userId, cropId) {
    try {
      const user = await db.User.findByPk(userId);
      const crop = await db.Crop.findOne({
        where: { id: cropId, userId, isHarvested: false },
        include: ['patch']
      });

      if (!user || !crop) {
        throw new Error('User or crop not found');
      }

      if (!crop.isReady()) {
        throw new Error('Crop not ready for harvest');
      }

      // Harvest the crop
      const harvestResult = crop.harvest();
      await crop.save();

      if (harvestResult) {
        // Award SBR coins to user
        user.sbrCoin += harvestResult.sbrEarned;
        user.totalCropsHarvested += harvestResult.yield;

        // Update patch statistics
        crop.patch.totalHarvests += 1;
        crop.patch.totalCropsGrown += harvestResult.yield;
        await crop.patch.save();

        await user.save();

        return {
          ...harvestResult,
          user: {
            sbrCoin: user.sbrCoin,
            totalCropsHarvested: user.totalCropsHarvested
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Error harvesting crop:', error);
      throw error;
    }
  }

  async expandFarm(userId) {
    try {
      const user = await db.User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const currentPatches = await db.Patch.count({ where: { userId } });
      const maxPatches = user.getMaxPatches();

      if (currentPatches >= maxPatches) {
        throw new Error('Maximum patches reached');
      }

      if (user.patchParts < 10) {
        throw new Error('Need 10 patch parts to create a new patch');
      }

      // Create new patch
      const newPatch = await db.Patch.create({
        userId,
        patchNumber: currentPatches + 1,
        isActive: true
      });

      // Deduct patch parts
      user.patchParts -= 10;
      user.totalPatchesOwned += 1;
      await user.save();

      return newPatch;
    } catch (error) {
      console.error('Error expanding farm:', error);
      throw error;
    }
  }

  async getFarmStatistics(userId) {
    try {
      const [
        totalPatches,
        activeCrops,
        readyCrops,
        totalHarvests,
        todayHarvests
      ] = await Promise.all([
        db.Patch.count({ where: { userId } }),
        db.Crop.count({ where: { userId, isHarvested: false } }),
        db.Crop.count({
          where: {
            userId,
            isHarvested: false,
            harvestAt: { [db.Sequelize.Op.lte]: new Date() }
          }
        }),
        db.Crop.count({ where: { userId, isHarvested: true } }),
        db.Crop.count({
          where: {
            userId,
            isHarvested: true,
            harvestedAt: {
              [db.Sequelize.Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        })
      ]);

      return {
        totalPatches,
        activeCrops,
        readyCrops,
        totalHarvests,
        todayHarvests
      };
    } catch (error) {
      console.error('Error getting farm statistics:', error);
      throw error;
    }
  }

  async getTopFarmers(limit = 10) {
    try {
      return await db.User.findAll({
        order: [['totalCropsHarvested', 'DESC']],
        limit,
        attributes: ['firstName', 'username', 'totalCropsHarvested', 'sbrCoin', 'isVip']
      });
    } catch (error) {
      console.error('Error getting top farmers:', error);
      throw error;
    }
  }

  async getPatchUpgrades(patchId) {
    try {
      const patch = await db.Patch.findByPk(patchId);
      if (!patch) {
        throw new Error('Patch not found');
      }

      return {
        sprinkler: {
          available: !patch.hasSprinkler,
          cost: 1000, // SBR coins
          benefit: '+10% growth speed'
        },
        greenhouse: {
          available: !patch.hasGreenhouse,
          cost: 2500, // SBR coins
          benefit: '+20% growth speed, weather protection'
        },
        fertilizer: {
          available: !patch.fertilized,
          cost: 500, // SBR coins
          benefit: '+15% yield for next crop'
        }
      };
    } catch (error) {
      console.error('Error getting patch upgrades:', error);
      throw error;
    }
  }

  async upgradePatch(userId, patchId, upgradeType) {
    try {
      const user = await db.User.findByPk(userId);
      const patch = await db.Patch.findOne({
        where: { id: patchId, userId }
      });

      if (!user || !patch) {
        throw new Error('User or patch not found');
      }

      const upgrades = await this.getPatchUpgrades(patchId);
      const upgrade = upgrades[upgradeType];

      if (!upgrade || !upgrade.available) {
        throw new Error('Upgrade not available');
      }

      if (user.sbrCoin < upgrade.cost) {
        throw new Error('Insufficient SBR coins');
      }

      // Apply upgrade
      switch (upgradeType) {
        case 'sprinkler':
          patch.hasSprinkler = true;
          break;
        case 'greenhouse':
          patch.hasGreenhouse = true;
          break;
        case 'fertilizer':
          patch.fertilized = true;
          break;
      }

      await patch.save();

      // Deduct cost
      user.sbrCoin -= upgrade.cost;
      await user.save();

      return patch;
    } catch (error) {
      console.error('Error upgrading patch:', error);
      throw error;
    }
  }
}

module.exports = FarmService;