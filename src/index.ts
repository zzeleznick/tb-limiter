import { Elysia } from "elysia";
import { ip } from "./ip";
import { limiter } from "./limiter";
import { getHitCount } from "./api";

const app = new Elysia();

const token = process.env.TINYBIRD_API_KEY
console.log(`TINYBIRD_API_KEY: ${token}`)

const api = new Elysia({ prefix: "/api" })
  .get("/echo/:message", ({ params: { message } }) => `Echo: ${message}`)
  .get("/whoami", ({ ip }) => `Your IP is: ${ip}`)
  .get("/hits", async ({ ip }) => { 
    console.log(`hits called for ip:${ip}`)
    const count = await getHitCount(ip);
    return `You have made ${count} requests in the last 60 seconds`;
  });


const limitedApi = new Elysia({ prefix: "/api/v2" })
  .use(limiter())
  .get("/echo/:message", ({ params: { message } }) => `Echo: ${message}`)
  .get("/whoami", ({ ip }) => `Your IP is: ${ip}`);

app
  .get("/", () => "Hello World from Elysia")
  .use(ip())
  .use(api)
  .use(limitedApi)
  .listen(3000);

console.log(`🦊 Elysia is running at on port ${app.server?.port}...`);
