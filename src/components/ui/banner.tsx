import { cn } from "@/lib/utils"

interface BannerProps {
  type?: 'success' | 'error'
  notificationType?: 'create' | 'update'
  message?: string
  email?: string
  password?: string
  onClose?: () => void
}

export function Banner({ type = 'success', notificationType, message, email, password, onClose }: BannerProps) {
  const isCredentials = email && password;
  
  return (
    <div className={cn(
      "rounded-md border p-3 text-sm",
      type === 'error' 
        ? "border-red-200 bg-red-50 text-red-800"
        : "border-green-200 bg-green-50 text-green-800"
    )}>
      {isCredentials ? (
        <>
          <div className="font-medium">Compte créé</div>
          <div>Identifiants à transmettre une seule fois:</div>
          <div className="mt-1"><span className="font-semibold">Email:</span> {email}</div>
          <div><span className="font-semibold">Mot de passe:</span> {password}</div>
        </>
      ) : (
        <div className="font-medium">
          {message}
          {type === 'success' && notificationType === 'create' && " créé avec succès"}
          {type === 'success' && notificationType === 'update' && " mis à jour avec succès"}
        </div>
      )}
      {onClose && (
        <button 
          className={cn(
            "mt-2 text-sm hover:underline",
            type === 'error' ? "text-red-700" : "text-green-700"
          )} 
          onClick={onClose}
        >
          Fermer
        </button>
      )}
    </div>
  )
}