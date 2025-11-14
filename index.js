import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import cron from 'node-cron';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Load commands
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  client.commands.set(command.default.data.name, command.default);
}

// Google Spreadsheet setup
const doc = new GoogleSpreadsheet(process.env.TASK_SHEET_ID);
await doc.loadInfo();

const tasksSheet = doc.sheetsByTitle[process.env.TASKS_SHEET_NAME];
const logSheet = doc.sheetsByTitle[process.env.LOG_SHEET_NAME];
const notificationSheet = doc.sheetsByTitle[process.env.NOTIFICATION_SHEET_NAME];

// Bot ready
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await client.application.commands.set(
    [...client.commands.values()].map(c => c.data.toJSON()),
    process.env.GUILD_ID
  );

  // Cron: 毎分通知チェック
  cron.schedule('* * * * *', async () => {
    const rows = await notificationSheet.getRows();
    const now = new Date();
    for (const row of rows) {
      if (row.executed === 'FALSE' && new Date(row.executiondatetime) <= now) {
        const taskRow = (await tasksSheet.getRows()).find(r => r.taskid === row.taskid);
        if (taskRow) {
          const channel = await client.channels.fetch(process.env.NOTIFICATION_CHANNEL_ID);
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
    await command.execute(interaction, tasksSheet, logSheet, notificationSheet, process.env);
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: 'エラーが発生しました。', ephemeral: true });
  }
});

client.login(process.env.BOT_TOKEN);
