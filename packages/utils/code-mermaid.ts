export const downloadPngBySvgElement = (svgElement: SVGSVGElement) => {
  const serializer = new XMLSerializer()
  const source = serializer.serializeToString(svgElement)
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`
  const img = new Image()
  img.crossOrigin = 'Anonymous'
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const rect = svgElement.getBoundingClientRect()
    const scaleFactor = 2
    canvas.width = rect.width * scaleFactor
    canvas.height = rect.height * scaleFactor
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      try {
        const pngUrl = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.href = pngUrl
        downloadLink.download = `mermaid-diagram-${Date.now()}.png`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Download PNG failed, falling back to SVG:', error)
        const svgBlob = new Blob([source], {
          type: 'image/svg+xml;charset=utf-8',
        })
        const svgUrl = URL.createObjectURL(svgBlob)
        const downloadLink = document.createElement('a')
        downloadLink.href = svgUrl
        downloadLink.download = `mermaid-diagram-${Date.now()}.svg`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
        URL.revokeObjectURL(svgUrl)
      }
    }
  }
  img.src = url
}
