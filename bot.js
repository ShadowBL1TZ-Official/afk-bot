const mineflayer = require('mineflayer');
require('./server.js'); // keep-alive web server for Replit

function startBot() {
  const bot = mineflayer.createBot({
    host: 'tavernmc.net',
    port: 25565,
    username: process.env.MC_EMAIL,
    password: process.env.MC_PASSWORD, // or MC_TOKEN if using token
    auth: 'microsoft' // important for MS accounts
    // no version field — let Mineflayer auto-detect
  });

  bot.once('spawn', () => {
    console.log(`Bot spawned on version ${bot.version}`);

    // Safe to require minecraft-data now
    const mcData = require('minecraft-data')(bot.version);

    // Move head slightly every 30s to avoid AFK kick
    setInterval(() => {
      if (bot.entity) {
        bot.look(bot.entity.yaw + 0.1, bot.entity.pitch, true);
      }
    }, 30000);
  });

  bot.on('kicked', (reason) => {
    console.log(`Kicked from server: ${reason}`);
  });

  bot.on('error', (err) => {
    console.error(`Bot error: ${err.message}`);
  });

  bot.on('end', () => {
    console.log('Bot disconnected, retrying in 10s...');
    setTimeout(startBot, 10000);
  });
}

startBot();
