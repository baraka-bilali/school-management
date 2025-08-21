"use client"

import { useState } from "react"
import Link from "next/link"
import { School, Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/cards"

export default function LoginPage() {
	const [showPassword, setShowPassword] = useState(false)

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
						<form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
								<div className="relative">
									<span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
										<Mail className="w-4 h-4" />
									</span>
									<Input type="email" placeholder="vous@exemple.com" className="pl-10" required />
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
								<div className="relative">
									<span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
										<Lock className="w-4 h-4" />
									</span>
									<Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10" required />
									<button
										type="button"
										className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
										onClick={() => setShowPassword((v) => !v)}
									>
										{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
									</button>
								</div>
							</div>

							<div className="flex items-center justify-between">
								<label className="flex items-center text-sm text-gray-600 select-none">
									<input type="checkbox" className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
									Se souvenir de moi
								</label>
								<Link href="#" className="text-sm text-indigo-600 hover:text-indigo-800">Mot de passe oublié ?</Link>
							</div>

							<Button type="submit" className="w-full mt-2">
								<LogIn className="w-4 h-4 mr-2" />
								Se connecter
							</Button>
						</form>

						<div className="text-center text-sm text-gray-600 mt-6">
							Pas de compte ?
							<Link href="#" className="ml-1 text-indigo-600 hover:text-indigo-800">Créer un compte</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
