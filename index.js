import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import cron from 'node-cron';
import config from './config.json' assert { type: "json" };

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Load commands
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  client.commands.set(command.default.data.name, command.default);
}

// Google Spreadsheet setup (認証なし)
const doc = new GoogleSpreadsheet(config.taskSheetId);
await doc.loadInfo();

const tasksSheet = doc.sheetsByTitle[config.tasksSheetName];
const logSheet = doc.sheetsByTitle[config.logSheetName];
const notificationSheet = doc.sheetsByTitle[config.notificationSheetName];

// Bot ready
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await client.application.commands.set([...client.commands.values()].map(c => c.data.toJSON()), config.guildId);

  // Cron: 毎分通知チェック
  cron.schedule('* * * * *', async () => {
    const rows = await notificationSheet.getRows();
    const now = new Date();
    for (const row of rows) {
      if (row.executed === 'FALSE' && new Date(row.executiondatetime) <= now) {
        const taskRow = (await tasksSheet.getRows()).find(r => r.taskid === row.taskid);
        if (taskRow) {
          const channel = await client.channels.fetch(config.notificationChannelId);
          await channel.send(`@<${taskRow.assigneduserid}> タスク "${taskRow.title}" の${row.notiftype}です。\n開始日: ${taskRow.startdate}\n締切日: ${taskRow.duedate}\n分類: ${taskRow.category}`);
        }
        row.executed = 'TRUE';
        await row.save();
      }
    }
  });
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction, tasksSheet, logSheet, notificationSheet, config);
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: 'エラーが発生しました。', ephemeral: true });
  }
});

client.login(config.botToken);
