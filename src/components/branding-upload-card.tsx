"use client"

import { useRef, useState } from "react"
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react"
import ImageCropModal from "@/components/image-crop-modal"
import { fileToDataUrl, type CropArea } from "@/lib/image-utils"

interface BrandingUploadCardProps {
  title: string
  description: string
  previewUrl: string | null
  uploading?: boolean
  onUpload: (crop: CropArea, imageSrc: string) => void | Promise<void>
  onRemove: () => void | Promise<void>
  aspect?: "square" | "wide" | "free"
  cropShape?: "rect" | "round"
  theme: "light" | "dark"
}

export default function BrandingUploadCard({
  title,
  description,
  previewUrl,
  uploading = false,
  onUpload,
  onRemove,
  aspect = "square",
  cropShape = "rect",
  theme,
}: BrandingUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const border = theme === "dark" ? "border-gray-700" : "border-gray-200"

  const cropAspect =
    aspect === "free" ? undefined : aspect === "wide" ? 16 / 9 : 1

  const handleFile = async (file: File) => {
    try {
      const dataUrl = await fileToDataUrl(file)
      setCropSrc(dataUrl)
    } catch {
      alert("Impossible de lire cette image.")
    }
  }

  const handleCropConfirm = async (crop: CropArea) => {
    if (!cropSrc) return
    try {
      await onUpload(crop, cropSrc)
    } finally {
      setCropSrc(null)
    }
  }

  return (
    <>
      <div className={`rounded-xl border ${border} p-4`}>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
        <p className={`text-xs ${textSecondary} mt-1 mb-3`}>{description}</p>

        <div
          className={`relative flex items-center justify-center overflow-hidden rounded-xl border-2 border-dashed ${
            theme === "dark" ? "border-gray-600 bg-gray-900/40" : "border-gray-200 bg-gray-50"
          } ${aspect === "wide" ? "h-28" : "h-36"}`}
          style={{
            backgroundImage: previewUrl
              ? undefined
              : "repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 16px 16px",
          }}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={title} className="max-h-full max-w-full object-contain p-2" />
          ) : (
            <div className={`flex flex-col items-center gap-1 ${textSecondary}`}>
              <ImageIcon className="h-8 w-8 opacity-40" />
              <span className="text-xs">Aucune image</span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
            e.target.value = ""
          }}
        />

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            <Upload className="h-3.5 w-3.5" />
            {previewUrl ? "Remplacer" : "Importer"}
          </button>
          {previewUrl && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => void onRemove()}
              className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          title={`Rogner — ${title}`}
          aspect={cropAspect}
          cropShape={cropShape}
          theme={theme}
          processing={uploading}
          onCancel={() => setCropSrc(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </>
  )
}
