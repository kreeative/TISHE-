// Shrinks a photo in the browser before upload: phones take 4–12 MB photos,
// the shop needs a 1600px copy for the product page and a 640px one for
// cards and thumbnails.

async function toJpeg(img: ImageBitmap, width: number, quality: number): Promise<string> {
  const scale = Math.min(1, width / img.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', quality)
}

export async function preparePhoto(file: File): Promise<{ full: string; thumb: string }> {
  const img = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    return { full: await toJpeg(img, 1600, 0.84), thumb: await toJpeg(img, 640, 0.8) }
  } finally {
    img.close()
  }
}
