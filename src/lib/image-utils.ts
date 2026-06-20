/** Redimensionne une image côté client et retourne un data URL JPEG. */
export function resizeImageFile(
  file: File,
  maxSize = 400,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Lecture du fichier impossible"))
    reader.onload = (e) => {
      const b64 = e.target?.result as string
      if (!b64) {
        reject(new Error("Fichier vide"))
        return
      }
      const img = new Image()
      img.onerror = () => reject(new Error("Image invalide"))
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1)
        canvas.width = Math.max(1, Math.round(img.width * ratio))
        canvas.height = Math.max(1, Math.round(img.height * ratio))
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Canvas indisponible"))
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL("image/jpeg", quality))
      }
      img.src = b64
    }
    reader.readAsDataURL(file)
  })
}

/** Sceau : un peu plus grand pour la lisibilité sur les reçus. */
export function resizeSealFile(file: File): Promise<string> {
  return resizeImageFile(file, 320, 0.9)
}

export function resizeLogoFile(file: File): Promise<string> {
  return resizeImageFile(file, 400, 0.88)
}

export function resizeProfilePhotoFile(file: File): Promise<string> {
  return resizeImageFile(file, 256, 0.88)
}
