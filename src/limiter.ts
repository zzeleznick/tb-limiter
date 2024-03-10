// Limiter for rate limiting
// plugin modeled from https://github.com/rayriffy/elysia-rate-limit/blob/fc6e38571a5a7512785d485bf29fbd26b74aeaad/src/services/plugin.ts
import { type Elysia } from 'elysia';

export type MinTimeUnits = 'ns' | 'us' | 'ms';

// Returns the current time in nanoseconds
// NOTE: Bun.nanoseconds() / BigInt(1_000_000) ~= performance.now()
export const now_ns = () => BigInt(Bun.nanoseconds()) + BigInt(1_000_000 * performance.timeOrigin);

// Returns the current time in microseconds
export const now_us = () => Number(now_ns() / BigInt(1_000));

// Returns the current time in milliseconds
// NOTE: Equivalent to Date.now()
export const now_ms = () => Number(now_ns() / BigInt(1_000_000));

export const now = (
    units: MinTimeUnits = 'ms'
) => {
    switch (units) {
        case 'ns': return now_ns();
        case 'us': return now_us();
        case 'ms': return now_ms();
    }
}

const maxPerDuration = 5;
const durationMs = 1000 * 60; // 60 seconds

export const limiter = () => {
    return (app: Elysia) => {
      app.onBeforeHandle(async ({ set, request, ip}) => {
          const clientKey = ip;
          console.log(`clientKey: ${clientKey}`)
          const hits = 0;
          const limit = maxPerDuration;
          // reject if limit were reached
          if (hits + 1 > limit) {
            // set.headers['Retry-After'] = 
            set.status = 429
            return `Rate limit exceeded. Try again later.`
          }
      })
  
      app.onError(async ({ request }) => {
        console.log(`ON Error`)
      })
  
      app.onStop(async () => {
        console.log(`ON STOP`)
      })
  
      return app
    }
  }