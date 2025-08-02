import { Markup } from 'telegraf';

const buttons = {
  profile: '👤 Мой профиль',
  stats: '📊 Статистика',
  myTeam: '👥 Моя команда',
  createTeam: '➕ Создать команду',
  joinTeam: '🤝 Вступить в команду',
  help: '❓ Помощь',
  completeRegistration: '✅ Завершить регистрацию',
};

export const userMenuTemplate = {
  teamMemberMenu() {
    return Markup.keyboard([
      [buttons.profile, buttons.stats],
      [buttons.myTeam, buttons.help],
    ]).resize();
  },

  noTeamMenu() {
    return Markup.keyboard([
      [buttons.profile, buttons.stats],
      [buttons.createTeam, buttons.joinTeam],
      [buttons.help],
    ]).resize();
  },

  notRegisteredMenu() {
    return Markup.keyboard([
      [buttons.completeRegistration, buttons.help],
    ]).resize();
  },

  buttons,
};
