import { SKILL_TREE_DATA } from './treeData.js';
import { GAME_CONFIG } from '../../config/constants.js';

export function getClassTree(className) {
  return SKILL_TREE_DATA[className] || [];
}

export function getNodeById(className, nodeId) {
  const tree = getClassTree(className);
  return tree.find(node => node.id === nodeId);
}

export function getEligibleNodes(className, subclassName, allocatedTree) {
  const tree = getClassTree(className);
  const allocatedMap = allocatedTree instanceof Map ? Object.fromEntries(allocatedTree) : (allocatedTree || {});

  return tree.filter(node => {
    // If it's a subclass node, character must have that exact subclass
    if (node.tier === 'subclass' && node.subclassName !== subclassName) {
      return false;
    }

    const currentRank = allocatedMap[node.id] || 0;
    if (currentRank >= node.maxRank) {
      return false; // Already maxed out
    }

    // Check prerequisites
    if (node.prerequisites && node.prerequisites.length > 0) {
      const meetsPrereqs = node.prerequisites.some(prereqId => (allocatedMap[prereqId] || 0) > 0);
      if (!meetsPrereqs) return false;
    }

    return true;
  });
}

export function allocateNodePoint(character, nodeId) {
  const className = character.className;
  const subclassName = character.subclassName;
  const node = getNodeById(className, nodeId);

  if (!node) {
    throw new Error(`Node ${nodeId} does not exist for class ${className}.`);
  }

  if (character.skillPoints.available < 1) {
    throw new Error(`No available skill points left.`);
  }

  const allocatedMap = character.passiveTree instanceof Map ? character.passiveTree : new Map(Object.entries(character.passiveTree || {}));
  const currentRank = allocatedMap.get(nodeId) || 0;

  if (currentRank >= node.maxRank) {
    throw new Error(`Node ${node.name} is already at max rank (${node.maxRank}).`);
  }

  if (node.tier === 'subclass' && node.subclassName !== subclassName) {
    throw new Error(`Must have subclass ${node.subclassName} to allocate this node.`);
  }

  if (node.prerequisites && node.prerequisites.length > 0) {
    const meetsPrereqs = node.prerequisites.some(p => (allocatedMap.get(p) || 0) > 0);
    if (!meetsPrereqs) {
      throw new Error(`Prerequisites not met for node ${node.name}.`);
    }
  }

  // Deduct point and increase rank
  allocatedMap.set(nodeId, currentRank + 1);
  character.passiveTree = allocatedMap;
  character.skillPoints.available -= 1;
  character.skillPoints.spent += 1;

  return { node, newRank: currentRank + 1 };
}

export function calculateRespecCost(node) {
  if (node.tier === 'subclass') {
    return { type: 'orb', currency: GAME_CONFIG.RESPEC_COSTS.SUBCLASS_ORB, amount: 1 };
  } else if (node.tier === 'keystone') {
    return { type: 'gold', currency: 'gold', amount: GAME_CONFIG.RESPEC_COSTS.KEYSTONE_GOLD };
  }
  return { type: 'gold', currency: 'gold', amount: GAME_CONFIG.RESPEC_COSTS.SMALL_NODE_GOLD };
}

export function respecNodePoint(character, nodeId) {
  const className = character.className;
  const node = getNodeById(className, nodeId);
  if (!node) throw new Error(`Node ${nodeId} not found.`);

  const allocatedMap = character.passiveTree instanceof Map ? character.passiveTree : new Map(Object.entries(character.passiveTree || {}));
  const currentRank = allocatedMap.get(nodeId) || 0;

  if (currentRank <= 0) {
    throw new Error(`Node ${node.name} is not currently allocated.`);
  }

  // Calculate respec cost
  const cost = calculateRespecCost(node);
  if (cost.type === 'gold') {
    if (character.gold < cost.amount) {
      throw new Error(`Not enough Gold. Requires ${cost.amount} Gold.`);
    }
    character.gold -= cost.amount;
  } else if (cost.type === 'orb') {
    const currentOrbs = character.orbs.get ? character.orbs.get(cost.currency) : (character.orbs[cost.currency] || 0);
    if (currentOrbs < cost.amount) {
      throw new Error(`Requires 1 ${cost.currency} (Orb of Unmaking) to respec a subclass node.`);
    }
    if (character.orbs.set) {
      character.orbs.set(cost.currency, currentOrbs - cost.amount);
    } else {
      character.orbs[cost.currency] = currentOrbs - cost.amount;
    }
  }

  const newRank = currentRank - 1;
  if (newRank > 0) {
    allocatedMap.set(nodeId, newRank);
  } else {
    allocatedMap.delete(nodeId);
  }

  character.passiveTree = allocatedMap;
  character.skillPoints.available += 1;
  character.skillPoints.spent -= 1;

  return { node, newRank };
}

export function accumulateTreeStats(className, allocatedTree) {
  const tree = getClassTree(className);
  const allocatedMap = allocatedTree instanceof Map ? Object.fromEntries(allocatedTree) : (allocatedTree || {});
  const stats = {};

  for (const [nodeId, rank] of Object.entries(allocatedMap)) {
    if (!rank || rank <= 0) continue;
    const node = tree.find(n => n.id === nodeId);
    if (!node) continue;

    const effectIndex = Math.min(rank - 1, node.effects.length - 1);
    const effect = node.effects[effectIndex];
    if (effect) {
      stats[effect.stat] = (stats[effect.stat] || 0) + effect.value;
    }
  }

  return stats;
}
