"use client"

import { useCallback, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
import { Loader2, X, ZoomIn } from "lucide-react"
import Portal from "@/components/portal"
import type { CropArea } from "@/lib/image-utils"

interface ImageCropModalProps {
  imageSrc: string
  title: string
  aspect?: number
  cropShape?: "rect" | "round"
  theme: "light" | "dark"
  onConfirm: (crop: CropArea) => void | Promise<void>
  onCancel: () => void
  processing?: boolean
}

export default function ImageCropModal({
  imageSrc,
  title,
  aspect,
  cropShape = "rect",
  theme,
  onConfirm,
  onCancel,
  processing = false,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = () => {
    if (!croppedAreaPixels) return
    void onConfirm({
      x: Math.round(croppedAreaPixels.x),
      y: Math.round(croppedAreaPixels.y),
      width: Math.round(croppedAreaPixels.width),
      height: Math.round(croppedAreaPixels.height),
    })
  }

  const bg = theme === "dark" ? "bg-gray-900" : "bg-white"
  const border = theme === "dark" ? "border-gray-700" : "border-gray-200"
  const text = theme === "dark" ? "text-gray-100" : "text-gray-900"
  const sub = theme === "dark" ? "text-gray-400" : "text-gray-500"

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={processing ? undefined : onCancel} />

        <div className={`relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl ${bg} ${border}`}>
          <div className={`flex items-center justify-between border-b px-4 py-3 ${border}`}>
            <div>
              <h3 className={`text-base font-semibold ${text}`}>{title}</h3>
              <p className={`text-xs ${sub}`}>Déplacez et zoomez pour rogner l&apos;image</p>
            </div>
            <button
              type="button"
              disabled={processing}
              onClick={onCancel}
              className={`flex h-8 w-8 items-center justify-center rounded-full ${theme === "dark" ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"} disabled:opacity-50`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative h-72 bg-black">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className={`space-y-3 px-4 py-4 ${border} border-t`}>
            <div className="flex items-center gap-3">
              <ZoomIn className={`h-4 w-4 shrink-0 ${sub}`} />
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer accent-indigo-600"
                disabled={processing}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={processing}
                onClick={onCancel}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium ${border} ${text} hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50`}
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={processing || !croppedAreaPixels}
                onClick={handleConfirm}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Valider
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
