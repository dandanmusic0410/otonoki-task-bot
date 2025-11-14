import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('task_add')
    .setDescription('タスクを追加する')
    .addStringOption(option => 
      option.setName('title')
        .setDescription('タスクタイトル')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('assigneduser')
        .setDescription('担当者')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('status')
        .setDescription('タスクの状態')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('duedate')
        .setDescription('締切日')
        .setRequired(true)),
  
  async execute(interaction, db) {
    const title = interaction.options.getString('title');
    const assignedUser = interaction.options.getString('assigneduser');
    const status = interaction.options.getString('status');
    const dueDate = interaction.options.getString('duedate');

    db.run(`INSERT INTO tasks (title, assignedUser, status, dueDate) VALUES (?, ?, ?, ?)`, 
      [title, assignedUser, status, dueDate], function(err) {
        if (err) {
          console.error(err.message);
          return interaction.reply({ content: 'タスクの追加に失敗しました。', ephemeral: true });
        }
        return interaction.reply({ content: `タスク "${title}" を追加しました。`, ephemeral: true });
    });
  }
};
