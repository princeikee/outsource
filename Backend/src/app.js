import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'
import routes from './routes/index.js'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js'

const app = express()
const corsOptions = {
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  origin(origin, callback) {
    if (!origin || env.frontendUrls.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`))
  },
}

app.use(helmet())
app.use(cors(corsOptions))
app.options(/.*/, cors(corsOptions))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }))

app.get('/', (req, res) => {
  res.json({ message: 'Taskflow ERP API', version: 'v1' })
})

app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), timestamp: new Date().toISOString() })
})

app.use('/api/v1', routes)
app.use(notFoundHandler)
app.use(errorHandler)

export default app
