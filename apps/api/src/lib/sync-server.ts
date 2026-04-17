/**
 * Attach a WebSocket server to a Node HTTP server for /api/sync.
 * JWT auth via ?token= query param.
 */
import { WebSocketServer } from 'ws'
import type { IncomingMessage, Server } from 'http'
import * as jose from 'jose'
import { syncService } from '../services/sync.service'

const JWT_SECRET = () => new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret')

async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET(), {
      issuer: 'theprimeway',
      audience: 'theprimeway',
    })
    if (payload.type !== 'access') return null
    return payload.userId as string
  } catch {
    return null
  }
}

export function attachSyncServer(server: Server) {
  const wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', async (req: IncomingMessage, socket, head) => {
    try {
      const url = new URL(req.url || '/', 'http://x')
      if (url.pathname !== '/api/sync') return

      const token = url.searchParams.get('token')
      if (!token) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
        return
      }

      const userId = await verifyToken(token)
      if (!userId) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
        return
      }

      wss.handleUpgrade(req, socket, head, (ws) => {
        syncService.register(userId, ws)

        const heartbeat = setInterval(() => {
          if (ws.readyState === ws.OPEN) ws.ping()
        }, 30_000)

        ws.on('close', () => {
          clearInterval(heartbeat)
          syncService.unregister(userId, ws)
        })
        ws.on('error', (err) => console.error('[SYNC_WS] error', err))
        ws.send(JSON.stringify({ type: 'hello', at: new Date().toISOString() }))
      })
    } catch (err) {
      console.error('[SYNC_WS] upgrade error', err)
      try {
        socket.destroy()
      } catch {}
    }
  })

  console.log('🔌 WebSocket sync server attached at /api/sync')
}
