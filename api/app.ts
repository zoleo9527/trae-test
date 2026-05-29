/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import plotRoutes from './routes/plots.js'
import transferRoutes from './routes/transfers.js'
import taskRoutes from './routes/tasks.js'
import loadingRoutes from './routes/loading.js'
import followupRoutes from './routes/followups.js'
import dashboardRoutes from './routes/dashboard.js'
import calendarRoutes from './routes/calendar.js'
import negotiationRoutes from './routes/negotiations.js'
import diseaseRoutes from './routes/diseases.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/plots', plotRoutes)
app.use('/api/transfers', transferRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/loading-orders', loadingRoutes)
app.use('/api/followups', followupRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/api/negotiations', negotiationRoutes)
app.use('/api/diseases', diseaseRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
