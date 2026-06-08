import express from 'express'
import cors from 'cors'
import { createProxyMiddleware } from 'http-proxy-middleware'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'gateway' }))

// Proxy examples
app.use('/api', createProxyMiddleware({ target: 'http://localhost:4000', changeOrigin: true }))

app.listen(3000, () => console.log('Gateway listening on http://localhost:3000'))
