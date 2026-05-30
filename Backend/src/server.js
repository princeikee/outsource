import { createServer } from 'node:http'
import app from './app.js'
import { env } from './config/env.js'
import { initSocket } from './sockets/index.js'

const server = createServer(app)

initSocket(server)

server.listen(env.port, () => {
  console.log(`API running on http://localhost:${env.port}`)
})
