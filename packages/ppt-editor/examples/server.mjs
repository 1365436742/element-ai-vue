import {
  createPresentationServer,
  createFileRoomStore,
  createLibreOfficeConverter,
} from '../dist/server.js'
const token = process.env.PPT_EDITOR_TOKEN
if (!token)
  throw new Error(
    'Set PPT_EDITOR_TOKEN to a strong development token. Replace authenticate with your identity service in production.'
  )
const service = createPresentationServer({
  authenticate: (supplied, roomId) =>
    supplied === token
      ? { id: 'developer', name: 'Developer', role: 'editor' }
      : undefined,
  allowedOrigins: (
    process.env.PPT_ALLOWED_ORIGINS ??
    'http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:5174'
  ).split(','),
  store: createFileRoomStore(process.env.PPT_DATA_DIR ?? './ppt-data'),
  conversion:
    process.env.PPT_ENABLE_CONVERSION === 'true'
      ? createLibreOfficeConverter({ binary: process.env.SOFFICE_BINARY })
      : undefined,
})
await service.listen(
  Number(process.env.PORT ?? 8787),
  process.env.HOST ?? '127.0.0.1'
)
console.log(
  'PPT service started. GET /health, WebSocket /collaboration, POST /convert'
)
for (const signal of ['SIGTERM', 'SIGINT'])
  process.once(signal, async () => {
    await service.close()
    process.exit(0)
  })
