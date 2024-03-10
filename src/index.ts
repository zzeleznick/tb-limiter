import { Hono } from 'hono'
import * as net from 'node:net'

const app = new Hono()
const api = new Hono()

app.get('/', (c) => {
  return c.text('Hello World from Hono!')
})

api.get('/echo/:message?', (c) => {
  const { message = 'Hello World!' } = c.req.param()
  return c.text(`Echo: ${message}`)
})

api.get('/whoami', (c) => {
  const userAgent = c.req.header('User-Agent')
  const sourceIP = c.req.raw.headers.get('x-forwarded-for')
  let connectionInfo = sourceIP
  if (!sourceIP) {
    const socketAddress = new net.Socket().address() as net.AddressInfo
    const ip = socketAddress?.address
    const port = socketAddress?.port
    connectionInfo = `${ip}:${port}`
  }
  return c.text(`Echo: ${connectionInfo}`)
})

app.route('/api', api)

export default app
