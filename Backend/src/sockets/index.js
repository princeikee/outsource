import { Server } from 'socket.io'
import { env } from '../config/env.js'
import { verifyAccessToken } from '../utils/jwt.js'

let io

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: env.frontendUrl,
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token

    if (!token) {
      return next(new Error('Missing socket auth token'))
    }

    try {
      socket.user = verifyAccessToken(token)
      socket.join(companyRoom(socket.user.companyId))
      return next()
    } catch {
      return next(new Error('Invalid socket auth token'))
    }
  })

  io.on('connection', (socket) => {
    socket.emit('connected', { companyId: socket.user.companyId })
  })

  return io
}

export function emitToCompany(companyId, eventName, payload) {
  if (!io) return
  io.to(companyRoom(companyId)).emit(eventName, payload)
}

function companyRoom(companyId) {
  return `company:${companyId}`
}
