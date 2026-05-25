const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const masterRoutes = require('./routes/master')
const activityRoutes = require('./routes/activities')
const distributionRoutes = require('./routes/distributions')

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }))

app.use('/api/auth', authRoutes)
app.use('/api/master', masterRoutes)
app.use('/api/activities', activityRoutes)
app.use('/api/distributions', distributionRoutes)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: err.message || '服务器错误' })
})

app.listen(PORT, () => {
  console.log(`[backend] server running at http://localhost:${PORT}`)
})
