const express = require('express')
const config = require('./config')
const { initSchema } = require('./db')
const { errorHandler, notFoundHandler } = require('./middleware/errors')

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

initSchema()

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', require('./routes/auth'))
app.use('/api/appointments', require('./routes/appointments'))
app.use('/api/orders', require('./routes/orders'))
app.use('/api', require('./routes/reworks'))
app.use('/api/tasks', require('./routes/tasks'))
app.use('/api/exports', require('./routes/exports'))
app.use('/api/audit', require('./routes/audit'))
app.use('/api/base', require('./routes/base'))

app.use(notFoundHandler)
app.use(errorHandler)

const port = config.port
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
  console.log(`API docs: POST /api/auth/login`)
})

module.exports = app
