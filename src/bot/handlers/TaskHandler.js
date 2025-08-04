class TaskHandler {
  constructor(bot, taskService, userService) {
    this.bot = bot;
    this.taskService = taskService;
    this.userService = userService;
  }

  async showTasks(msg) {
    const chatId = msg.chat.id;
    await this.bot.sendMessage(chatId, '📋 Tasks coming soon! 🚧');
  }

  async handleCallback(query) {
    const chatId = query.message.chat.id;
    await this.bot.sendMessage(chatId, '🚧 Task features under development!');
  }
}

module.exports = TaskHandler;