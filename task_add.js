import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('task_add')
    .setDescription('タスクを追加します')
    .addStringOption(opt => opt.setName('title').setDescription('タスク名').setRequired(true))
    .addStringOption(opt => opt.setName('category').setDescription('分類').setRequired(true))
    .addUserOption(opt => opt.setName('assigned').setDescription('担当者').setRequired(true))
    .addStringOption(opt => opt.setName('startdate').setDescription('開始日').setRequired(true))
    .addStringOption(opt => opt.setName('duedate').setDescription('締切日').setRequired(true))
    .addStringOption(opt => opt.setName('status').setDescription('ステータス').setRequired(true))
    .addStringOption(opt => opt.setName('memo').setDescription('メモ')),

  async execute(interaction, tasksSheet) {
    const rows = await tasksSheet.getRows();
    const newId = rows.length > 0 ? Math.max(...rows.map(r => Number(r.taskid))) + 1 : 1;

    await tasksSheet.addRow({
      taskid: newId,
      title: interaction.options.getString('title'),
      category: interaction.options.getString('category'),
      assigneduserid: interaction.options.getUser('assigned').id,
      assignedname: interaction.options.getUser('assigned').username,
      startdate: interaction.options.getString('startdate'),
      duedate: interaction.options.getString('duedate'),
      status: interaction.options.getString('status'),
      memo: interaction.options.getString('memo') || '',
      lastupdated: new Date().toISOString()
    });

    await interaction.reply(`タスク "${interaction.options.getString('title')}" を追加しました。`);
  }
};
