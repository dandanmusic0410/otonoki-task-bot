import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import cron from 'node-cron';
import sqlite3 from 'sqlite3';
import path from 'path';

// SQLite データベース接続
const db = new sqlite3.Database(path.resolve('tasks.db'));

// テーブル作成
db.run(`CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  assignedUser TEXT,
  status TEXT,
  dueDate TEXT,
  category TEXT
)`);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// コマンドファイルの読み込み
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  client.commands.set(command.default.data.name, command.default);
}

// Bot準備完了
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Cron: 毎分通知チェック
  cron.schedule('* * * * *', async () => {
    // ここにタスクの進捗状況や通知処理を実装します
    console.log("Cron task checking...");
  });
});

// コマンド実行処理
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction, db);
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: 'エラーが発生しました。', ephemeral: true });
  }
});

client.login(process.env.BOT_TOKEN);
