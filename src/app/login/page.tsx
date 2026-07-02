"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Mail, Lock, Eye, EyeOff, LogIn, KeyRound, Sparkles, PartyPopper, User, Phone, MapPin, Shield, Check, ChevronRight, X, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/cards"
import Portal from "@/components/portal"
import { BLOOD_GROUPS } from "@/lib/blood-groups"

type ModalStep =
  | "none"
  | "password_choice"    // ELEVE: choisir changer ou garder
  | "change_password"    // changer le mot de passe
  | "profile_completion" // compléter le profil
  | "welcome"            // modal de bienvenue

export default function LoginPage() {
	const [showPassword, setShowPassword] = useState(false)
	const [form, setForm] = useState({ email: "", password: "" })
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")

	// Modal step state
	const [step, setStep] = useState<ModalStep>("none")
	const [pendingRole, setPendingRole] = useState<string>("")
	const [pendingStudentProfileCompleted, setPendingStudentProfileCompleted] = useState(true)

	// Password change form
	const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" })
	const [changingPassword, setChangingPassword] = useState(false)
	const [passwordError, setPasswordError] = useState("")
	const [showNewPassword, setShowNewPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)

	// Profile completion form
	const [profileForm, setProfileForm] = useState({
		birthPlace: "",
		nationality: "",
		address: "",
		parentName1: "",
		parentPhone1: "",
		parentEmail1: "",
		parentName2: "",
		parentPhone2: "",
		parentEmail2: "",
		bloodGroup: "",
		allergies: "",
		medicalNotes: "",
		emergencyContact: "",
		emergencyPhone: "",
	})
	const [savingProfile, setSavingProfile] = useState(false)

	// Read-only student info (admin-set fields) for profile completion display
	const [studentReadOnly, setStudentReadOnly] = useState<{
		code: string; lastName: string; middleName: string; firstName: string; gender: string; birthDate: string; className: string
	} | null>(null)

	// Welcome
	const [userName, setUserName] = useState("")

	const router = useRouter()

	const profileUpper = (value: string) => value.toUpperCase()

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setForm({ ...form, [e.target.name]: e.target.value })
	}

	const redirectByRole = (role: string) => {
		switch (role) {
			case "ADMIN":
			case "COMPTABLE":
			case "DIRECTEUR_DISCIPLINE":
			case "DIRECTEUR_ETUDES":
				router.push("/admin")
				break
			case "CAISSIER":
				router.push("/admin/fees")
				break
			case "ELEVE":
				router.push("/student")
				break
			case "PROFESSEUR":
				router.push("/teacher")
				break
			default:
				router.push("/")
		}
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

			if (data.token) {
				localStorage.setItem("token", data.token)
				localStorage.removeItem("schoolName")
				const payload = JSON.parse(atob(data.token.split(".")[1]))

				if (payload.role === "SUPER_ADMIN") {
					setError("Accès réservé: veuillez utiliser la page Super Admin.")
					return
				}

				setPendingRole(payload.role)

					// ELEVE avec mot de passe temporaire → choix
				if (payload.role === "ELEVE" && data.temporaryPassword) {
					// Pré-charger les infos élève
					try {
						const meRes = await fetch("/api/student/me", { credentials: "include" })
						if (meRes.ok) {
							const meData = await meRes.json()
							setUserName(meData.student?.firstName || "")
							setPendingStudentProfileCompleted(meData.student?.profileCompleted === true)
							setStudentReadOnly({
								code: meData.student?.code || "",
								lastName: meData.student?.lastName || "",
								middleName: meData.student?.middleName || "",
								firstName: meData.student?.firstName || "",
								gender: meData.student?.gender || "",
								birthDate: meData.student?.birthDate || "",
								className: meData.student?.class || "",
							})
						}
					} catch {}
					setStep("password_choice")
					return
				}

				// Admin avec mot de passe temporaire → forcer changement
				if (data.temporaryPassword) {
					setStep("change_password")
					return
				}

				// ELEVE sans mot de passe temporaire → vérifier profil
				if (payload.role === "ELEVE") {
					try {
						const meRes = await fetch("/api/student/me", { credentials: "include" })
						if (meRes.ok) {
							const meData = await meRes.json()
							setUserName(meData.student?.firstName || "")
							setStudentReadOnly({
								code: meData.student?.code || "",
								lastName: meData.student?.lastName || "",
								middleName: meData.student?.middleName || "",
								firstName: meData.student?.firstName || "",
								gender: meData.student?.gender || "",
								birthDate: meData.student?.birthDate || "",
								className: meData.student?.class || "",
							})
							if (!meData.student?.profileCompleted) {
								setPendingStudentProfileCompleted(false)
								setStep("profile_completion")
								return
							}
						}
					} catch {}
					router.push("/student")
					return
				}

				redirectByRole(payload.role)
			}
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Erreur inconnue")
		} finally {
			setLoading(false)
		}
	}

	// ELEVE: garder le mot de passe (skip)
	const handleSkipPasswordChange = async () => {
		try {
			await fetch("/api/auth/skip-password-change", { method: "POST", credentials: "include" })
		} catch {}
		if (!pendingStudentProfileCompleted) {
			setStep("profile_completion")
		} else {
			setStep("welcome")
			setTimeout(() => router.push("/student"), 3500)
		}
	}

	// ELEVE: changer le mot de passe depuis le choix
	const handleChooseChangePassword = () => {
		setStep("change_password")
	}

	// Changer le mot de passe (admin ou élève)
	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault()
		setChangingPassword(true)
		setPasswordError("")
		try {
			const res = await fetch("/api/auth/change-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(passwordForm),
			})
			let data
			try { data = await res.json() } catch { throw new Error("Erreur de communication") }
			if (!res.ok) throw new Error(data.error || "Erreur lors du changement")

			// Récupérer nom utilisateur
			try {
				const meRes = await fetch("/api/auth/me", { credentials: "include" })
				if (meRes.ok) {
					const meData = await meRes.json()
					setUserName(meData.user?.name || meData.user?.prenom || "")
					if (!pendingRole) setPendingRole(meData.user?.role || "")
				}
			} catch {}

			localStorage.removeItem("schoolName")

			// Après changement de mot de passe, si ELEVE et profil non complété → compléter profil
			if ((pendingRole === "ELEVE") && !pendingStudentProfileCompleted) {
				setStep("profile_completion")
			} else {
				setStep("welcome")
				const role = pendingRole
				setTimeout(() => redirectByRole(role), 3500)
			}
		} catch (err: unknown) {
			setPasswordError(err instanceof Error ? err.message : "Erreur inconnue")
		} finally {
			setChangingPassword(false)
		}
	}

	// Sauvegarder le profil étudiant
	const handleSaveProfile = async () => {
		setSavingProfile(true)
		try {
			const res = await fetch("/api/student/profile", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ ...profileForm, profileCompleted: true }),
			})
			if (res.ok) {
				setStep("welcome")
				setTimeout(() => router.push("/student"), 3500)
			}
		} catch {}
		setSavingProfile(false)
	}

	const handleSkipProfile = async () => {
		try {
			await fetch("/api/student/profile", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ profileCompleted: true }),
			})
		} catch {}
		setStep("welcome")
		setTimeout(() => router.push("/student"), 3500)
	}

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
			<div className="w-full max-w-md">
				<div className="flex flex-col items-center mb-4">
					<div className="mb-2">
						<Image src="/Kelasi360.png" alt="Kelasi 360" width={180} height={180} priority />
					</div>
					<p className="text-sm text-gray-500">Connectez-vous à votre compte</p>
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
									<button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700" onClick={() => setShowPassword((v) => !v)}>
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
					</CardContent>
				</Card>
			</div>

			{/* ── Modal : Choix mot de passe (ELEVE première connexion) ── */}
			{step === "password_choice" && (
				<Portal>
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
						<div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
							<div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border-b border-indigo-100">
								<div className="flex items-center gap-3 mb-1">
									<div className="w-12 h-12 rounded-full bg-indigo-500/15 flex items-center justify-center">
										<KeyRound className="w-6 h-6 text-indigo-600" />
									</div>
									<div>
										<h2 className="text-xl font-bold text-gray-900">Première connexion</h2>
										<p className="text-sm text-gray-500">Bienvenue, {userName || "élève"} !</p>
									</div>
								</div>
							</div>
							<div className="p-6">
								<p className="text-gray-700 mb-2">
									Un mot de passe temporaire vous a été attribué par votre école.
								</p>
								<p className="text-gray-600 text-sm mb-6">
									Souhaitez-vous le changer ou continuer avec ce mot de passe ?
								</p>
								<div className="space-y-3">
									<button
										onClick={handleChooseChangePassword}
										className="w-full flex items-center justify-between px-5 py-4 rounded-xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-400 transition-all group"
									>
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
												<Shield className="w-5 h-5 text-indigo-600" />
											</div>
											<div className="text-left">
												<p className="font-semibold text-gray-900">Oui, créer mon propre mot de passe</p>
												<p className="text-xs text-gray-500">Recommandé pour votre sécurité</p>
											</div>
										</div>
										<ChevronRight className="w-5 h-5 text-indigo-400" />
									</button>
									<button
										onClick={handleSkipPasswordChange}
										className="w-full flex items-center justify-between px-5 py-4 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-all group"
									>
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
												<Lock className="w-5 h-5 text-gray-500" />
											</div>
											<div className="text-left">
												<p className="font-semibold text-gray-900">Non, garder le mot de passe actuel</p>
												<p className="text-xs text-gray-500">Vous pourrez le changer plus tard dans Paramètres</p>
											</div>
										</div>
										<ChevronRight className="w-5 h-5 text-gray-400" />
									</button>
								</div>
							</div>
						</div>
					</div>
				</Portal>
			)}

			{/* ── Modal : Changement de mot de passe ── */}
			{step === "change_password" && (
				<Portal>
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
						<div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
							<div className="p-6 border-b border-yellow-200 bg-yellow-50">
								<div className="flex items-center gap-3 mb-2">
									<div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
										<KeyRound className="w-6 h-6 text-yellow-600" />
									</div>
									<div>
										<h2 className="text-xl font-bold text-gray-900">
											{pendingRole === "ELEVE" ? "Créer votre mot de passe" : "Changement de mot de passe requis"}
										</h2>
										<p className="text-sm text-gray-600">Première connexion détectée</p>
									</div>
								</div>
							</div>
							<form onSubmit={handleChangePassword} className="p-6 space-y-4">
								{passwordError && (
									<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{passwordError}</div>
								)}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe <span className="text-red-500">*</span></label>
									<div className="relative">
										<Input
											type={showNewPassword ? "text" : "password"}
											value={passwordForm.newPassword}
											onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
											className="w-full pr-10"
											placeholder="Au moins 6 caractères"
											required
											minLength={6}
										/>
										<button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
											{showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
										</button>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe <span className="text-red-500">*</span></label>
									<div className="relative">
										<Input
											type={showConfirmPassword ? "text" : "password"}
											value={passwordForm.confirmPassword}
											onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
											className="w-full pr-10"
											placeholder="Retapez votre mot de passe"
											required
											minLength={6}
										/>
										<button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
											{showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
										</button>
									</div>
								</div>
								{passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
									<p className="text-sm text-red-600">Les mots de passe ne correspondent pas</p>
								)}
								<div className="flex gap-3 pt-2">
									{pendingRole === "ELEVE" && (
										<button
											type="button"
											onClick={() => setStep("password_choice")}
											className="flex-none px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
										>
											Retour
										</button>
									)}
									<Button
										type="submit"
										className="flex-1"
										disabled={
											changingPassword ||
											!passwordForm.newPassword ||
											!passwordForm.confirmPassword ||
											passwordForm.newPassword !== passwordForm.confirmPassword ||
											passwordForm.newPassword.length < 6
										}
									>
										<KeyRound className="w-4 h-4 mr-2" />
										{changingPassword ? "Enregistrement..." : "Confirmer"}
									</Button>
								</div>
							</form>
						</div>
					</div>
				</Portal>
			)}

			{/* ── Modal : Complétion du profil (ELEVE) ── */}
			{step === "profile_completion" && (
				<Portal>
					<div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
						<div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
						<div className="relative bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[92vh] flex flex-col overflow-hidden">
							<div className="p-5 sm:p-6 bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-600 text-white shrink-0">
								<div className="flex items-center gap-3">
									<div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
										<User className="w-6 h-6" />
									</div>
									<div>
										<h2 className="text-lg sm:text-xl font-bold">Complétez votre profil</h2>
										<p className="text-sm text-indigo-100">Quelques infos pour votre dossier scolaire</p>
									</div>
								</div>
							</div>
							<div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">

								{/* Read-only: admin-set fields */}
								{studentReadOnly && (
									<div className="rounded-xl border border-indigo-100 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50/80 to-purple-50/50 dark:from-indigo-500/10 dark:to-purple-500/5 p-4">
										<p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase mb-3 tracking-wide">Informations enregistrées par l&apos;école</p>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
											{[
												{ label: "Code élève", value: studentReadOnly.code },
												{ label: "Nom", value: studentReadOnly.lastName },
												{ label: "Post-nom", value: studentReadOnly.middleName },
												{ label: "Prénom", value: studentReadOnly.firstName },
												{ label: "Genre", value: studentReadOnly.gender === "M" || studentReadOnly.gender === "Masculin" ? "Masculin" : studentReadOnly.gender === "F" || studentReadOnly.gender === "Féminin" ? "Féminin" : studentReadOnly.gender || "—" },
												{ label: "Naissance", value: studentReadOnly.birthDate ? new Date(studentReadOnly.birthDate).toLocaleDateString("fr-FR") : "—" },
												{ label: "Classe", value: studentReadOnly.className || "—" },
											].map(({ label, value }) => (
												<div key={label} className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-2.5 border border-white dark:border-gray-700/50">
													<p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
													<p className="text-sm font-medium text-gray-800 dark:text-gray-100">{value || "—"}</p>
												</div>
											))}
										</div>
									</div>
								)}

								{/* Fillable fields */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
											<MapPin className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
											Lieu de naissance
										</label>
										<Input
											value={profileForm.birthPlace}
											onChange={(e) => setProfileForm({ ...profileForm, birthPlace: profileUpper(e.target.value) })}
											placeholder="Ex : Kinshasa"
											className="uppercase"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nationalité</label>
										<Input
											value={profileForm.nationality}
											onChange={(e) => setProfileForm({ ...profileForm, nationality: profileUpper(e.target.value) })}
											placeholder="Ex : Congolaise"
											className="uppercase"
										/>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
										<MapPin className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
										Adresse résidentielle
									</label>
									<Input
										value={profileForm.address}
										onChange={(e) => setProfileForm({ ...profileForm, address: profileUpper(e.target.value) })}
										placeholder="Ex : Av. de l'Université, Commune de Lingwala"
										className="uppercase"
									/>
								</div>

								<div className="pt-2 border-t border-gray-100 dark:border-gray-700/50">
									<p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-1.5">
										<User className="w-4 h-4 text-blue-500" />
										Parent / Tuteur principal
									</p>
									<div className="space-y-3">
										<Input
											value={profileForm.parentName1}
											onChange={(e) => setProfileForm({ ...profileForm, parentName1: profileUpper(e.target.value) })}
											placeholder="Nom complet du parent/tuteur"
											className="rounded-xl uppercase"
										/>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											<div className="relative">
												<Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
												<Input
													value={profileForm.parentPhone1}
													onChange={(e) => setProfileForm({ ...profileForm, parentPhone1: e.target.value })}
													placeholder="Téléphone"
													className="pl-8"
												/>
											</div>
											<Input
												type="email"
												value={profileForm.parentEmail1}
												onChange={(e) => setProfileForm({ ...profileForm, parentEmail1: e.target.value })}
												placeholder="Email (optionnel)"
											/>
										</div>
									</div>
								</div>

								<div className="pt-2 border-t border-gray-100 dark:border-gray-700/50">
									<p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-1.5">
										<User className="w-4 h-4 text-indigo-500" />
										Parent / Tuteur secondaire <span className="text-xs font-normal text-gray-400">(optionnel)</span>
									</p>
									<div className="space-y-3">
										<Input
											value={profileForm.parentName2}
											onChange={(e) => setProfileForm({ ...profileForm, parentName2: profileUpper(e.target.value) })}
											placeholder="Nom complet"
											className="rounded-xl uppercase"
										/>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											<div className="relative">
												<Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
												<Input
													value={profileForm.parentPhone2}
													onChange={(e) => setProfileForm({ ...profileForm, parentPhone2: e.target.value })}
													placeholder="Téléphone"
													className="pl-8"
												/>
											</div>
											<Input
												type="email"
												value={profileForm.parentEmail2}
												onChange={(e) => setProfileForm({ ...profileForm, parentEmail2: e.target.value })}
												placeholder="Email (optionnel)"
											/>
										</div>
									</div>
								</div>

								<div className="pt-2 border-t border-gray-100 dark:border-gray-700/50">
									<p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-1.5">
										<Phone className="w-4 h-4 text-red-500" />
										Contact d&apos;urgence
									</p>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<Input
											value={profileForm.emergencyContact}
											onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: profileUpper(e.target.value) })}
											placeholder="Nom du contact"
											className="uppercase"
										/>
										<div className="relative">
											<Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
											<Input
												value={profileForm.emergencyPhone}
												onChange={(e) => setProfileForm({ ...profileForm, emergencyPhone: e.target.value })}
												placeholder="Numéro d'urgence"
												className="pl-8"
											/>
										</div>
									</div>
								</div>

								<div className="rounded-xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 p-4 space-y-3">
									<p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
										<Heart className="w-3.5 h-3.5" />
										Informations médicales <span className="font-normal normal-case text-gray-500">(optionnel)</span>
									</p>
									<div>
										<label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Groupe sanguin</label>
										<select
											value={profileForm.bloodGroup}
											onChange={(e) => setProfileForm({ ...profileForm, bloodGroup: e.target.value })}
											className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
										>
											<option value="">Je ne sais pas / Non renseigné</option>
											{BLOOD_GROUPS.map((g) => (
												<option key={g} value={g}>{g}</option>
											))}
										</select>
									</div>
									<div>
										<label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Allergies connues</label>
										<Input
											value={profileForm.allergies}
											onChange={(e) => setProfileForm({ ...profileForm, allergies: profileUpper(e.target.value) })}
											placeholder="Ex : pénicilline, arachides..."
											className="rounded-xl uppercase"
										/>
									</div>
									<div>
										<label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Notes médicales</label>
										<Input
											value={profileForm.medicalNotes}
											onChange={(e) => setProfileForm({ ...profileForm, medicalNotes: profileUpper(e.target.value) })}
											placeholder="Informations importantes pour l'école"
											className="rounded-xl uppercase"
										/>
									</div>
								</div>
							</div>
							<div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-700 flex flex-col-reverse sm:flex-row gap-3 shrink-0 bg-white dark:bg-gray-900">
								<button
									onClick={handleSkipProfile}
									className="flex-none px-4 py-2.5 text-sm font-medium rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
								>
									Plus tard
								</button>
								<button
									onClick={handleSaveProfile}
									disabled={savingProfile}
									className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/25"
								>
									{savingProfile ? (
										<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
									) : (
										<Check className="w-4 h-4" />
									)}
									Enregistrer et continuer
								</button>
							</div>
						</div>
					</div>
				</Portal>
			)}

			{/* ── Welcome Modal ── */}
			{step === "welcome" && (
				<Portal>
					<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
						<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden">
							<div className="absolute inset-0 pointer-events-none">
								{Array.from({ length: 50 }).map((_, i) => (
									<div
										key={i}
										className="confetti"
										style={{
											left: `${Math.random() * 100}%`,
											animationDelay: `${Math.random() * 3}s`,
											backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][Math.floor(Math.random() * 6)]
										}}
									/>
								))}
							</div>
							<div className="relative z-10 p-8 text-center">
								<div className="mb-6 flex justify-center">
									<div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center animate-bounce">
										<PartyPopper className="w-10 h-10 text-white" />
									</div>
								</div>
								<h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
									{new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir'} {userName} !
								</h2>
								<div className="space-y-3 text-gray-600">
									<p className="text-lg font-medium">🎉 Bienvenue sur votre espace !</p>
									<p className="text-sm">Vous allez être redirigé dans quelques instants...</p>
								</div>
								<div className="mt-8 flex gap-2 justify-center">
									<Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
									<Sparkles className="w-4 h-4 text-blue-500 animate-pulse delay-75" />
									<Sparkles className="w-5 h-5 text-green-500 animate-pulse delay-150" />
								</div>
							</div>
						</div>
					</div>
				</Portal>
			)}
		</div>
	)
}
