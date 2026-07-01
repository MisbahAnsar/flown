const COOLDOWN_MS = 5_000;
const lastInvocationAt = new Map<string, number>();

export function checkRateLimit(userKey: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const lastRun = lastInvocationAt.get(userKey);

  if (lastRun !== undefined && now - lastRun < COOLDOWN_MS) {
    const retryAfterSeconds = Math.ceil((COOLDOWN_MS - (now - lastRun)) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  lastInvocationAt.set(userKey, now);
  return { allowed: true };
}

export function resetRateLimitForTests(): void {
  lastInvocationAt.clear();
}
