const mineflayer = require('mineflayer');

function startBot() {
  const bot = mineflayer.createBot({
    host: 'tavernmc.net', // e.g. play.example.com
    port: 25565,             // default Minecraft port
    username: process.env.MC_EMAIL, // from Render env vars
    auth: 'microsoft'
  });

  bot.on('spawn', () => {
    console.log('Bot spawned!');
    // Move head slightly every 30s to avoid AFK kick
    setInterval(() => {
      bot.look(bot.entity.yaw + 0.1, bot.entity.pitch, true);
    }, 30000);
  });

  bot.on('end', () => {
    console.log('Bot disconnected, retrying...');
    setTimeout(startBot, 5000);
  });
}

startBot();
