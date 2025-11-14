import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('task_add')
    .setDescription('タスクを追加')
    .addStringOption(o => o.setName('title').setDescription('タスク名').setRequired(true))
    .addStringOption(o => o.setName('category').setDescription('分類').setRequired(true)
      .addChoices(
        { name: '企画', value: '企画' },
        { name: '広報', value: '広報' },
        { name: '出演者', value: '出演者' },
        { name: '打楽器', value: '打楽器' },
        { name: '会計', value: '会計' },
        { name: '要員', value: '要員' },
        { name: '進行', value: '進行' },
        { name: '終演後', value: '終演後' },
        { name: '次回準備', value: '次回準備' }
      ))
    .addUserOption(o => o.setName('assigned').setDescription('担当者').setRequired(true))
    .addStringOption(o => o.setName('startdate').setDescription('開始日 YYYY-MM-DD').setRequired(true))
    .addStringOption(o => o.setName('duedate').setDescription('締切日 YYYY-MM-DD').setRequired(true))
    .addStringOption(o => o.setName('status').setDescription('ステータス').setRequired(true)
      .addChoices(
        { name: '未着手', value: '未着手' },
        { name: '進行中', value: '進行中' },
        { name: '完了', value: '完了' }
      ))
    .addStringOption(o => o.setName('memo').setDescription('メモ')),
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
    await interaction.reply({ content: `タスク "${interaction.options.getString('title')}" を追加しました。ID: ${newId}`, ephemeral: false });
  }
};
