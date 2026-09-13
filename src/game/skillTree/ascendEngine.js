import { ASCEND_TREE_DATA } from './ascendData.js';
import { GAME_CONFIG } from '../../config/constants.js';

export function getAscendTree(subclassName) {
  return ASCEND_TREE_DATA[subclassName] || [];
}

export function getAscendNodeById(subclassName, nodeId) {
  const tree = getAscendTree(subclassName);
  return tree.find(node => node.id === nodeId);
}

export function getEligibleAscendNodes(subclassName, allocatedAscendTree, availablePoints) {
  const tree = getAscendTree(subclassName);
  const allocatedMap = allocatedAscendTree instanceof Map ? Object.fromEntries(allocatedAscendTree) : (allocatedAscendTree || {});

  return tree.filter(node => {
    const currentRank = allocatedMap[node.id] || 0;
    if (currentRank >= node.maxRank) {
      return false; // Already allocated
    }

    if (availablePoints < node.pointCost) {
      return false; // Can't afford it yet — cost varies, unlike the main tree
    }

    if (node.prerequisites && node.prerequisites.length > 0) {
      const meetsPrereqs = node.prerequisites.some(prereqId => (allocatedMap[prereqId] || 0) > 0);
      if (!meetsPrereqs) return false;
    }

    return true;
  });
}

export function allocateAscendNode(character, nodeId) {
  const subclassName = character.subclassName;
  if (!subclassName) {
    throw new Error(`Must Ascend into a subclass before spending Ascendancy Points.`);
  }

  const node = getAscendNodeById(subclassName, nodeId);
  if (!node) {
    throw new Error(`Node ${nodeId} does not exist for subclass ${subclassName}.`);
  }

  const allocatedMap = character.ascendTree instanceof Map ? character.ascendTree : new Map(Object.entries(character.ascendTree || {}));
  const currentRank = allocatedMap.get(nodeId) || 0;

  if (currentRank >= node.maxRank) {
    throw new Error(`Node ${node.name} is already allocated.`);
  }

  if (character.ascendPoints.available < node.pointCost) {
    throw new Error(`Requires ${node.pointCost} Ascendancy Points for ${node.name} (have ${character.ascendPoints.available}).`);
  }

  if (node.prerequisites && node.prerequisites.length > 0) {
    const meetsPrereqs = node.prerequisites.some(p => (allocatedMap.get(p) || 0) > 0);
    if (!meetsPrereqs) {
      throw new Error(`Prerequisites not met for node ${node.name}.`);
    }
  }

  allocatedMap.set(nodeId, currentRank + 1);
  character.ascendTree = allocatedMap;
  character.ascendPoints.available -= node.pointCost;
  character.ascendPoints.spent += node.pointCost;

  return { node, newRank: currentRank + 1 };
}

// Pure recompute of owed-vs-granted Ascendancy Points based on milestones
// crossed — not a consuming while-loop like resolveLevelUps(), since
// milestones aren't a spendable resource like XP. Idempotent: safe to call
// on every read (character profile view, right after ascending, etc).
export function resolveAscendMilestones(character) {
  if (!character.subclassName) return 0;

  const { ASCEND_MILESTONES, ASCEND_POINTS_PER_MILESTONE } = GAME_CONFIG.SKILL_TREE_GATES;
  const level = character.level || 1;
  const owed = ASCEND_MILESTONES.filter(lvl => level >= lvl).length * ASCEND_POINTS_PER_MILESTONE;
  const grantedSoFar = character.ascendPoints.available + character.ascendPoints.spent;
  const delta = owed - grantedSoFar;

  if (delta > 0) {
    character.ascendPoints.available += delta;
  }

  return Math.max(0, delta);
}

export function accumulateAscendStats(subclassName, allocatedAscendTree) {
  const tree = getAscendTree(subclassName);
  const allocatedMap = allocatedAscendTree instanceof Map ? Object.fromEntries(allocatedAscendTree) : (allocatedAscendTree || {});
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
