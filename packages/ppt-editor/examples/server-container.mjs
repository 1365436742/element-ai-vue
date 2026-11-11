import {
  createPresentationServer,
  createFileRoomStore,
  createLibreOfficeConverter,
} from 'element-ai-vue-ppt/server'
const token = process.env.PPT_EDITOR_TOKEN
if (!token) throw new Error('PPT_EDITOR_TOKEN is required')
const service = createPresentationServer({
  authenticate: (supplied) =>
    supplied === token
      ? { id: 'service-user', name: 'Service user', role: 'editor' }
      : undefined,
  store: createFileRoomStore(process.env.PPT_DATA_DIR ?? '/data'),
  conversion: createLibreOfficeConverter(),
  allowedOrigins: (process.env.PPT_ALLOWED_ORIGINS ?? '')
    .split(',')
    .filter(Boolean),
})
await service.listen(
  Number(process.env.PORT ?? 8787),
  process.env.HOST ?? '0.0.0.0'
)
