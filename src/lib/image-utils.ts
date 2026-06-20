export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export interface CropOutputOptions {
  maxSize: number
  format: "png" | "jpeg"
  quality?: number
  circular?: boolean
}

const CHECKERBOARD =
  "repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 16px 16px"

export const transparencyPreviewStyle = {
  backgroundImage: CHECKERBOARD,
} as const

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Image invalide"))
    img.src = src
  })
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Lecture du fichier impossible"))
    reader.onload = (e) => {
      const b64 = e.target?.result as string
      if (!b64) reject(new Error("Fichier vide"))
      else resolve(b64)
    }
    reader.readAsDataURL(file)
  })
}

/** Rogne une image et retourne un data URL (PNG = transparence conservée). */
export async function getCroppedImageDataUrl(
  imageSrc: string,
  pixelCrop: CropArea,
  options: CropOutputOptions
): Promise<string> {
  const image = await loadImage(imageSrc)
  const { maxSize, format, quality = 0.92, circular = false } = options

  const scale = Math.min(maxSize / pixelCrop.width, maxSize / pixelCrop.height, 1)
  const outW = Math.max(1, Math.round(pixelCrop.width * scale))
  const outH = Math.max(1, Math.round(pixelCrop.height * scale))

  const canvas = document.createElement("canvas")
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas indisponible")

  ctx.clearRect(0, 0, outW, outH)

  if (circular) {
    ctx.beginPath()
    ctx.arc(outW / 2, outH / 2, Math.min(outW, outH) / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outW,
    outH
  )

  if (format === "png") return canvas.toDataURL("image/png")
  return canvas.toDataURL("image/jpeg", quality)
}

export async function fileToDataUrl(file: File): Promise<string> {
  return readFileAsDataUrl(file)
}

/** Logo : PNG pour garder la transparence sur les reçus et l'aperçu. */
export function processLogoCrop(imageSrc: string, crop: CropArea): Promise<string> {
  return getCroppedImageDataUrl(imageSrc, crop, { maxSize: 480, format: "png" })
}

/** Sceau : PNG, taille plus grande pour le PDF. */
export function processSealCrop(imageSrc: string, crop: CropArea): Promise<string> {
  return getCroppedImageDataUrl(imageSrc, crop, { maxSize: 560, format: "png" })
}

/** Photo profil : PNG rond pour éviter le fond noir autour du cercle. */
export function processProfileCrop(imageSrc: string, crop: CropArea): Promise<string> {
  return getCroppedImageDataUrl(imageSrc, crop, {
    maxSize: 320,
    format: "png",
    circular: true,
  })
}
