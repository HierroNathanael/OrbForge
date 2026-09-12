const lastUse = new Map();

export function checkCooldown(key, seconds) {
  const now = Date.now();
  const readyAt = lastUse.get(key) || 0;

  if (now < readyAt) {
    return { onCooldown: true, remainingSeconds: Math.ceil((readyAt - now) / 1000) };
  }

  lastUse.set(key, now + seconds * 1000);
  return { onCooldown: false, remainingSeconds: 0 };
}

export function clearCooldown(key) {
  lastUse.delete(key);
}
