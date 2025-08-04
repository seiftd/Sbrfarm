const db = require('../database/models');

class TaskService {
  async initializeUserTasks(userId) {
    try {
      const activeTasks = await db.Task.findAll({
        where: { isActive: true }
      });

      const userTasks = activeTasks.map(task => ({
        userId,
        taskId: task.id,
        progress: 0,
        isCompleted: false,
        rewardClaimed: false
      }));

      await db.UserTask.bulkCreate(userTasks, {
        ignoreDuplicates: true
      });

      return userTasks.length;
    } catch (error) {
      console.error('Error initializing user tasks:', error);
      throw error;
    }
  }

  async getUserTasks(userId, type = null) {
    try {
      const whereClause = { userId };
      const taskWhere = { isActive: true };
      
      if (type) {
        taskWhere.type = type;
      }

      const userTasks = await db.UserTask.findAll({
        where: whereClause,
        include: [
          {
            model: db.Task,
            as: 'task',
            where: taskWhere
          }
        ],
        order: [
          ['isCompleted', 'ASC'],
          [{ model: db.Task, as: 'task' }, 'priority', 'DESC']
        ]
      });

      return userTasks.map(userTask => ({
        ...userTask.toJSON(),
        progressPercentage: Math.min((userTask.progress / userTask.task.targetValue) * 100, 100)
      }));
    } catch (error) {
      console.error('Error getting user tasks:', error);
      throw error;
    }
  }

  async updateTaskProgress(userId, targetType, amount) {
    try {
      const relevantTasks = await db.UserTask.findAll({
        where: {
          userId,
          isCompleted: false
        },
        include: [
          {
            model: db.Task,
            as: 'task',
            where: {
              targetType,
              isActive: true
            }
          }
        ]
      });

      const completedTasks = [];

      for (const userTask of relevantTasks) {
        userTask.progress += amount;
        
        if (userTask.progress >= userTask.task.targetValue && !userTask.isCompleted) {
          userTask.isCompleted = true;
          userTask.completedAt = new Date();
          completedTasks.push(userTask);
        }

        await userTask.save();
      }

      return completedTasks;
    } catch (error) {
      console.error('Error updating task progress:', error);
      throw error;
    }
  }

  async claimTaskReward(userId, userTaskId) {
    try {
      const userTask = await db.UserTask.findOne({
        where: {
          id: userTaskId,
          userId,
          isCompleted: true,
          rewardClaimed: false
        },
        include: ['task']
      });

      if (!userTask) {
        throw new Error('Task not found or already claimed');
      }

      const user = await db.User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Award reward based on type
      const task = userTask.task;
      let rewardGiven = false;

      switch (task.rewardType) {
        case 'sbr_coin':
          user.sbrCoin += task.rewardAmount;
          rewardGiven = true;
          break;
        case 'water_drops':
          user.addWater(task.rewardAmount);
          rewardGiven = true;
          break;
        case 'boosters':
          user.boosters = Math.min(user.boosters + task.rewardAmount, 10);
          rewardGiven = true;
          break;
        case 'seeds':
          // For seed rewards, assume potato seeds for now
          user.potatoSeeds += task.rewardAmount;
          rewardGiven = true;
          break;
        case 'patch_parts':
          user.patchParts += task.rewardAmount;
          rewardGiven = true;
          break;
      }

      if (rewardGiven) {
        await user.save();
        userTask.rewardClaimed = true;
        userTask.claimedAt = new Date();
        await userTask.save();

        return {
          task: task.title,
          rewardType: task.rewardType,
          rewardAmount: task.rewardAmount,
          rewardDescription: task.rewardDescription
        };
      }

      throw new Error('Invalid reward type');
    } catch (error) {
      console.error('Error claiming task reward:', error);
      throw error;
    }
  }

  async getTaskStatistics(userId) {
    try {
      const [
        totalTasks,
        completedTasks,
        pendingTasks,
        rewardsClaimed
      ] = await Promise.all([
        db.UserTask.count({ where: { userId } }),
        db.UserTask.count({ where: { userId, isCompleted: true } }),
        db.UserTask.count({ where: { userId, isCompleted: false } }),
        db.UserTask.count({ where: { userId, rewardClaimed: true } })
      ]);

      return {
        totalTasks,
        completedTasks,
        pendingTasks,
        rewardsClaimed,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error getting task statistics:', error);
      throw error;
    }
  }

  async createCustomTask(taskData) {
    try {
      const task = await db.Task.create(taskData);
      
      // Add task to all active users
      const activeUsers = await db.User.findAll({
        where: {
          lastActive: {
            [db.Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        },
        attributes: ['id']
      });

      const userTasks = activeUsers.map(user => ({
        userId: user.id,
        taskId: task.id,
        progress: 0,
        isCompleted: false,
        rewardClaimed: false
      }));

      await db.UserTask.bulkCreate(userTasks);

      return task;
    } catch (error) {
      console.error('Error creating custom task:', error);
      throw error;
    }
  }

  async resetDailyTasks() {
    try {
      // Reset daily task progress for all users
      await db.UserTask.update({
        progress: 0,
        isCompleted: false,
        rewardClaimed: false,
        completedAt: null,
        claimedAt: null
      }, {
        include: [
          {
            model: db.Task,
            as: 'task',
            where: {
              type: 'daily',
              isRepeatable: true
            }
          }
        ]
      });

      console.log('Daily tasks reset completed');
    } catch (error) {
      console.error('Error resetting daily tasks:', error);
    }
  }

  async resetWeeklyTasks() {
    try {
      // Reset weekly task progress for all users
      await db.UserTask.update({
        progress: 0,
        isCompleted: false,
        rewardClaimed: false,
        completedAt: null,
        claimedAt: null
      }, {
        include: [
          {
            model: db.Task,
            as: 'task',
            where: {
              type: 'weekly',
              isRepeatable: true
            }
          }
        ]
      });

      console.log('Weekly tasks reset completed');
    } catch (error) {
      console.error('Error resetting weekly tasks:', error);
    }
  }

  async getLeaderboard(taskType = null, limit = 10) {
    try {
      const taskWhere = { isActive: true };
      if (taskType) {
        taskWhere.type = taskType;
      }

      const leaderboard = await db.UserTask.findAll({
        attributes: [
          'userId',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('UserTask.id')), 'completedTasksCount']
        ],
        where: {
          isCompleted: true,
          rewardClaimed: true
        },
        include: [
          {
            model: db.Task,
            as: 'task',
            where: taskWhere,
            attributes: []
          },
          {
            model: db.User,
            as: 'user',
            attributes: ['firstName', 'username', 'isVip']
          }
        ],
        group: ['userId'],
        order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('UserTask.id')), 'DESC']],
        limit
      });

      return leaderboard;
    } catch (error) {
      console.error('Error getting task leaderboard:', error);
      throw error;
    }
  }

  async getTaskProgress(userId, taskId) {
    try {
      const userTask = await db.UserTask.findOne({
        where: { userId, taskId },
        include: ['task']
      });

      if (!userTask) {
        return null;
      }

      return {
        progress: userTask.progress,
        target: userTask.task.targetValue,
        percentage: Math.min((userTask.progress / userTask.task.targetValue) * 100, 100),
        isCompleted: userTask.isCompleted,
        rewardClaimed: userTask.rewardClaimed
      };
    } catch (error) {
      console.error('Error getting task progress:', error);
      throw error;
    }
  }

  // Specific task update methods
  async updateCropHarvestTask(userId, amount = 1) {
    return await this.updateTaskProgress(userId, 'crops_harvested', amount);
  }

  async updateAdsWatchedTask(userId, amount = 1) {
    return await this.updateTaskProgress(userId, 'ads_watched', amount);
  }

  async updateReferralTask(userId, amount = 1) {
    return await this.updateTaskProgress(userId, 'referrals', amount);
  }

  async updateSbrEarnedTask(userId, amount) {
    return await this.updateTaskProgress(userId, 'sbr_earned', amount);
  }

  async updateWaterUsedTask(userId, amount) {
    return await this.updateTaskProgress(userId, 'water_used', amount);
  }
}

module.exports = TaskService;