// Limiter for rate limiting
// plugin modeled from https://github.com/rayriffy/elysia-rate-limit/blob/fc6e38571a5a7512785d485bf29fbd26b74aeaad/src/services/plugin.ts
import { type Elysia } from "elysia";
import { type ApiEvent, postEvent, getHitCount } from "./api";

export type MinTimeUnits = "ns" | "us" | "ms";

/* NOTE:
```
Bun.nanoseconds() ~= BigInt(Math.floor(1_000_000 * performance.now()))
```
For our purposes, we will use the more cross-platform `performance.now()` for now.
*/

// Returns the current time in nanoseconds
export const now_ns = () => BigInt(Math.floor(1_000_000 * performance.now())) + BigInt(1_000_000 * performance.timeOrigin)
// Returns the current time in microseconds
export const now_us = () => Math.floor(1_000 * performance.now()) + Math.floor(1_000 * performance.timeOrigin)
// Returns the current time in milliseconds
export const now_ms = () => Date.now();

export const now = (units: MinTimeUnits = "ms") => {
  switch (units) {
    case "ns":
      return now_ns();
    case "us":
      return now_us();
    case "ms":
      return now_ms();
  }
};

const maxPerDuration = 5;
const durationInSeconds = 60;

const ms_from = (start_us: number) => Math.floor((now_us() - start_us) / 1_000);

// Send event to Tinybird with timing
const wrappedSendEvent = async (event: ApiEvent) => {
  const start = now_us();
  console.log(`[${start}] wrappedSendEvent: ${JSON.stringify(event)}`);
  await postEvent(event);
  console.log(`[${now_us()}] wrappedSendEvent done in ${ms_from(start)}ms`);
}

// Check on usage
const wrappedGetHitCount = async (ip: string, lookback_sec = durationInSeconds) => {
  const start = now_us();
  console.log(`[${start}] wrappedGetHitCount: ${ip}`);
  const count = await getHitCount(ip, lookback_sec);
  console.log(`[${now_us()}] wrappedGetHitCount done in ${ms_from(start)}ms`);
  return count;
}

// Concurrent write event and check usage
const concurrentWriteAndCheck = async (ip: string, event: ApiEvent) => {
  const start = now_us();
  console.log(`[${start}] concurrentWriteAndCheck: ${ip}`);
  const [count, _] = await Promise.all([
    wrappedGetHitCount(ip),
    wrappedSendEvent(event),
  ]);
  console.log(`[${now_us()}] concurrentWriteAndCheck done in ${ms_from(start)}ms`);
  return count;
}

// Rate limiter plugin
export const limiter = () => {
  return (app: Elysia) => {
    app.onBeforeHandle(async ({ set, request, ip }) => {
      const path = (new URL(request.url)?.pathname) ?? "";
      const clientKey = ip;
      console.log(`clientKey: ${clientKey}, path: ${path}`);
      const dt = new Date().toISOString();
      const date = dt.slice(0, 10);
      const event = {
        date,
        dt,
        ip,
        method: request.method,
        path,
        tier: "free",
        ts: now("us"),
      } as ApiEvent;
      // Send api usage event to Tinybird
      const hits = await concurrentWriteAndCheck(ip, event);
      const limit = maxPerDuration;
      // reject if limit were reached
      if (hits + 1 > limit) {
        // set.headers['Retry-After'] =
        set.status = 429;
        return `Rate limit exceeded. Try again later.`;
      }
    });

    app.onError(async ({ request }) => {
      console.log(`ON Error`);
    });

    app.onStop(async () => {
      console.log(`ON STOP`);
    });

    return app;
  };
};
