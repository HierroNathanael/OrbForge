export function addBoost(userBoostList, multiplier, durationDays) {
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  const newBoost = { multiplier, expiresAt };

  userBoostList.push(newBoost);
  // Sort descending by multiplier so highest multiplier is always at index 0
  userBoostList.sort((a, b) => b.multiplier - a.multiplier);
  return userBoostList;
}

export function getActiveBoostMultiplier(userBoostList) {
  const now = new Date();
  // Clean expired boosts
  while (userBoostList.length > 0 && userBoostList[0].expiresAt <= now) {
    userBoostList.shift();
  }

  if (userBoostList.length === 0) return 1.0;
  return userBoostList[0].multiplier;
}
