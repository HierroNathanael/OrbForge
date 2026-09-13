import { SKILL_REGISTRY, CLASS_CORE_SKILL } from './skillRegistry.js';

export function learnSkillFromBook(character, item) {
  if (item.type !== 'skill_book' || !item.skillId) {
    throw new Error('Not a Skill Book.');
  }
  if (!SKILL_REGISTRY[item.skillId]) {
    throw new Error('Unknown skill.');
  }
  if ((character.knownSkills || []).some(k => k.skillId === item.skillId)) {
    throw new Error(`You already know ${SKILL_REGISTRY[item.skillId].name}.`);
  }

  character.knownSkills.push({ skillId: item.skillId, rank: 1, source: 'skillbook_drop' });
  return { skillId: item.skillId };
}

export function equipSkill(character, skillId) {
  const coreId = CLASS_CORE_SKILL[character.className];
  if (!SKILL_REGISTRY[skillId]) {
    throw new Error('Unknown skill.');
  }
  if (skillId !== coreId && !(character.knownSkills || []).some(k => k.skillId === skillId)) {
    throw new Error('You have not learned that skill yet.');
  }

  character.activeSkillLoadout = skillId === coreId ? [] : [skillId];
  return { skillId };
}

export function rankUpSkill(character, skillId) {
  const entry = (character.knownSkills || []).find(k => k.skillId === skillId);
  if (!entry) {
    throw new Error('You have not learned that skill yet.');
  }

  const skill = SKILL_REGISTRY[skillId];
  if (entry.rank >= skill.ranks.length) {
    throw new Error(`${skill.name} is already at max rank.`);
  }
  if (character.combatSkillPoints.available < 1) {
    throw new Error('No available Combat Skill Points.');
  }

  entry.rank += 1;
  character.combatSkillPoints.available -= 1;
  character.combatSkillPoints.spent += 1;
  return { skillId, newRank: entry.rank };
}
