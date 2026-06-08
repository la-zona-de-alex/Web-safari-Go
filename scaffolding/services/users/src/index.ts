import express from 'express'

const app = express()
app.use(express.json())

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'users' }))

app.listen(5001, () => console.log('Users service on http://localhost:5001'))

export {}
