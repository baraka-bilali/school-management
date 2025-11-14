"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { School, Mail, Lock, Eye, EyeOff, LogIn, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/cards"
import Portal from "@/components/portal"

export default function LoginPage() {
	const [showPassword, setShowPassword] = useState(false)
	const [form, setForm] = useState({ email: "", password: "" })
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")
	const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
	const [passwordForm, setPasswordForm] = useState({
		newPassword: "",
		confirmPassword: ""
	})
	const [changingPassword, setChangingPassword] = useState(false)
	const [passwordError, setPasswordError] = useState("")
	const router = useRouter()

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setForm({ ...form, [e.target.name]: e.target.value })
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError("")
		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			})
			const data = await res.json()
			if (!res.ok) throw new Error(data.error || "Erreur inconnue")
			
			// Vérifier si le mot de passe est temporaire
			if (data.temporaryPassword) {
				// Afficher le modal de changement de mot de passe
				setShowChangePasswordModal(true)
				return
			}
			
			// Stocker le token dans le localStorage
			if (data.token) {
				localStorage.setItem("token", data.token)
				// Décoder le token pour obtenir le rôle
				const payload = JSON.parse(atob(data.token.split(".")[1]))
				// Bloquer l'accès du SUPER_ADMIN à cette page
				if (payload.role === "SUPER_ADMIN") {
					setError("Accès réservé: veuillez utiliser la page Super Admin.")
					return
				}
				// Redirections basées sur le rôle
				switch (payload.role) {
					case "ADMIN":
					case "COMPTABLE":
					case "DIRECTEUR_DISCIPLINE":
					case "DIRECTEUR_ETUDES":
						router.push("/admin")
						break
					default:
						router.push("/")
				}
			}
		} catch (err: any) {
			setError(err.message)
		} finally {
			setLoading(false)
		}
	}

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault()
		setChangingPassword(true)
		setPasswordError("")
		
		try {
			const res = await fetch("/api/auth/change-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(passwordForm)
			})
			
			const data = await res.json()
			
			if (!res.ok) {
				throw new Error(data.error || "Erreur lors du changement de mot de passe")
			}
			
			// Succès - rediriger vers la page appropriée
			const payload = JSON.parse(atob(localStorage.getItem("token")?.split(".")[1] || ""))
			
			switch (payload.role) {
				case "ADMIN":
				case "COMPTABLE":
				case "DIRECTEUR_DISCIPLINE":
				case "DIRECTEUR_ETUDES":
					router.push("/admin")
					break
				default:
					router.push("/")
			}
		} catch (err: any) {
			setPasswordError(err.message)
		} finally {
			setChangingPassword(false)
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
			<div className="w-full max-w-md">
				<div className="flex flex-col items-center mb-6">
					<div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-3">
						<School className="w-6 h-6 text-indigo-600" />
					</div>
					<h1 className="text-2xl font-semibold text-gray-800">School Management</h1>
					<p className="text-sm text-gray-500 mt-1">Connectez-vous à votre compte</p>
				</div>
				<Card className="shadow-lg">
					<CardHeader>
						<CardTitle>Connexion</CardTitle>
					</CardHeader>
					<CardContent>
						<form className="space-y-4" onSubmit={handleSubmit}>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
								<div className="relative">
									<span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
										<Mail className="w-4 h-4" />
									</span>
									<Input type="email" name="email" placeholder="vous@exemple.com" className="pl-10" required value={form.email} onChange={handleChange} />
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
								<div className="relative">
									<span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
										<Lock className="w-4 h-4" />
									</span>
									<Input type={showPassword ? "text" : "password"} name="password" placeholder="••••••••" className="pl-10 pr-10" required value={form.password} onChange={handleChange} />
									<button
										type="button"
										className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
										onClick={() => setShowPassword((v) => !v)}
									>
										{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
									</button>
								</div>
							</div>
							{error && <div className="text-red-600 text-sm">{error}</div>}
							<Button type="submit" className="w-full mt-2" disabled={loading}>
								<LogIn className="w-4 h-4 mr-2" />
								{loading ? "Connexion..." : "Se connecter"}
							</Button>
						</form>
						{/* Lien d'inscription supprimé - création réservée au SUPER_ADMIN */}
					</CardContent>
				</Card>
			</div>

			{/* Modal de changement de mot de passe obligatoire */}
			{showChangePasswordModal && (
				<Portal>
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
						<div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
							<div className="p-6 border-b border-yellow-200 bg-yellow-50">
								<div className="flex items-center gap-3 mb-2">
									<div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
										<KeyRound className="w-6 h-6 text-yellow-600" />
									</div>
									<div>
										<h2 className="text-xl font-bold text-gray-900">Changement de mot de passe requis</h2>
										<p className="text-sm text-gray-600">Première connexion détectée</p>
									</div>
								</div>
							</div>

							<form onSubmit={handleChangePassword} className="p-6 space-y-4">
								<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
									<p className="text-sm text-blue-800">
										🔒 Pour votre sécurité, vous devez créer un nouveau mot de passe avant de continuer.
									</p>
								</div>

								{passwordError && (
									<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
										{passwordError}
									</div>
								)}

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Nouveau mot de passe <span className="text-red-500">*</span>
									</label>
									<Input
										type="password"
										value={passwordForm.newPassword}
										onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
										className="w-full"
										placeholder="Au moins 6 caractères"
										required
										minLength={6}
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Confirmer le mot de passe <span className="text-red-500">*</span>
									</label>
									<Input
										type="password"
										value={passwordForm.confirmPassword}
										onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
										className="w-full"
										placeholder="Retapez votre mot de passe"
										required
										minLength={6}
									/>
								</div>

								{passwordForm.newPassword && passwordForm.confirmPassword && 
									passwordForm.newPassword !== passwordForm.confirmPassword && (
									<p className="text-sm text-red-600">Les mots de passe ne correspondent pas</p>
								)}

								<div className="pt-4">
									<Button
										type="submit"
										className="w-full"
										disabled={changingPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
									>
										<KeyRound className="w-4 h-4 mr-2" />
										{changingPassword ? "Changement en cours..." : "Confirmer et continuer"}
									</Button>
								</div>
							</form>
						</div>
					</div>
				</Portal>
			)}
		</div>
	)
}
