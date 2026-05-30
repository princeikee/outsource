import dotenv from 'dotenv'

dotenv.config()

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  frontendUrls: (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean),
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL,
  superAdminName: process.env.SUPER_ADMIN_NAME || 'Platform Owner',
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD,
}
