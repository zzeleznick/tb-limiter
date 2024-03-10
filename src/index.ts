import { Elysia } from 'elysia'
import { ip } from "./ip";


const api = new Elysia({ prefix: '/api' })
  .get('/echo/:message', ({ params: { message } }) => `Echo: ${message}`)
  .get('/whoami', ({ ip }) => `Your IP is: ${ip}`)

const app = new Elysia()
  // .use(app => app.derive(({ request }) => ({ ip: app.server?.requestIP(request) })))
  // .use(ip({ checkHeaders: ['x-forwarded-for']}))
  .use(ip())
  .use(api)
	.get('/', () => 'Hello World from Elysia')
	.listen(3000)

console.log(`🦊 Elysia is running at on port ${app.server?.port}...`)
