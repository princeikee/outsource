import { Prisma } from '@prisma/client'

export function notFoundHandler(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error)
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Record already exists', details: error.meta })
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Record not found' })
    }
  }

  const statusCode = error.statusCode || 500

  return res.status(statusCode).json({
    message: error.message || 'Internal server error',
    details: error.details,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  })
}
