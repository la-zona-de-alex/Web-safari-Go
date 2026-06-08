const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')

const app = express()
app.use(cors())
app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

app.post('/auth/login', (req, res) => {
  // placeholder: verify user and password
  const user = { id: 1, email: req.body.email }
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '2h' })
  res.json({ token })
})

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'backend' }))

app.listen(4000, () => console.log('Backend running on http://localhost:4000'))
