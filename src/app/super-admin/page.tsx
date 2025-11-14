"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { TrendingUp, TrendingDown, Users, Building2, CreditCard, DollarSign, Search, Plus, Pencil, Trash2, Bell, Moon, Sun, LogOut, MapPin, UserCheck, GraduationCap, FileText, Download, Printer, Eye, UserPlus, Mail, Phone, Briefcase, User, KeyRound, Lock, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Portal from "@/components/portal"
import NotificationsSection from "@/components/notifications-section"

type School = { 
  id: number; 
  nomEtablissement: string; 
  codeEtablissement?: string | null; 
  ville: string;
  province: string;
  typeEtablissement: string;
  telephone: string;
  email: string;
  directeurNom: string;
  etatCompte: string;
  dateCreation: string;
}
type User = { id: number; name: string; email: string; role: string }

export default function SuperAdminHome() {
  const router = useRouter()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("7")
  const [activeTab, setActiveTab] = useState("stats")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [modalMounted, setModalMounted] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState({
    // Informations générales
    nomEtablissement: "",
    typeEtablissement: "PRIVE" as "PUBLIC" | "PRIVE" | "SEMI_PRIVE",
    niveauEnseignement: [] as string[],
    codeEtablissement: "",
    anneeCreation: "",
    slogan: "",
    
    // Localisation & Contact
    adresse: "",
    ville: "",
    province: "",
    pays: "RDC",
    telephone: "",
    email: "",
    siteWeb: "",
    
    // Direction
    directeurNom: "",
    directeurTelephone: "",
    directeurEmail: "",
    secretaireAcademique: "",
    comptable: "",
    personnelAdministratifTotal: "",
    
    // Informations légales
    rccm: "",
    idNat: "",
    nif: "",
    agrementMinisteriel: "",
    dateAgrement: "",
    
    // Académique
    cycles: "",
    nombreClasses: "",
    nombreEleves: "",
    nombreEnseignants: "",
    langueEnseignement: "",
    programmes: "",
    joursOuverture: "",
    
    // Abonnement (étape finale)
    formule: "Basic" as "Basic" | "Premium" | "Enterprise"
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [isEditSuccess, setIsEditSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({})
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [initialFormData, setInitialFormData] = useState<typeof form | null>(null)
  const [stats, setStats] = useState({
    totalSchools: 0,
    activeSchools: 0,
    suspendedSchools: 0,
    totalUsers: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalAdmins: 0,
    totalClasses: 0,
    recentSchools: 0,
    schoolsGrowth: "0",
    monthlyRevenue: 0,
    revenueChange: "0",
    schoolsByType: [] as { type: string, count: number }[],
    schoolsByProvince: [] as { province: string, count: number }[],
    unreadNotifications: 0,
    subscriptionsByPlan: { Basic: 0, Premium: 0, Enterprise: 0 }
  })
  const [hasChanges, setHasChanges] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isEditTransitioning, setIsEditTransitioning] = useState(false)
  const [isDetailsTransitioning, setIsDetailsTransitioning] = useState(false)
  
  // States pour les administrateurs
  const [admins, setAdmins] = useState<any[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false)
  const [adminModalMounted, setAdminModalMounted] = useState(false)
  const [adminModalVisible, setAdminModalVisible] = useState(false)
  const [adminForm, setAdminForm] = useState({
    schoolId: "",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    fonction: "Directeur"
  })
  const [generatedCredentials, setGeneratedCredentials] = useState<{email: string, password: string} | null>(null)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [showAdminSuccess, setShowAdminSuccess] = useState(false)
  const [creatingAdmin, setCreatingAdmin] = useState(false)
  const [togglingAdmin, setTogglingAdmin] = useState<number | null>(null)
  
  // États pour la recherche, tri et pagination des admins
  const [adminSearchQuery, setAdminSearchQuery] = useState("")
  const [adminFilterSchool, setAdminFilterSchool] = useState("all")
  const [adminCurrentPage, setAdminCurrentPage] = useState(1)
  const adminsPerPage = 10

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.role !== 'SUPER_ADMIN') {
          router.replace('/login')
        }
      } catch {}
    }
  }, [router])

  const loadSchools = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/super-admin/schools', {
        credentials: 'include' // Important: envoie les cookies HttpOnly
      })
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // Non authentifié ou pas les bonnes permissions
          console.warn('⚠️ Non authentifié - Redirection vers login')
          router.push('/super-admin/login')
          return
        }
        const errorData = await res.json().catch(() => ({}))
        console.error('Error loading schools:', errorData)
        throw new Error(errorData.error || 'Erreur lors du chargement des écoles')
      }
      
      const data = await res.json()
      setSchools(data.schools || [])
    } catch (e: any) {
      console.error('Load schools error:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const initData = async () => {
      const userData = await loadUser()
      if (userData) {
        loadSchools()
        loadStats()
        loadAdmins()
      }
    }
    initData()
  }, [])

  const loadUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        return data.user
      } else {
        // Si non autorisé, rediriger vers la page de login
        router.push('/super-admin/login')
        return null
      }
    } catch (e) {
      console.error(e)
      return null
    }
  }

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        credentials: 'include'
      })
      if (res.ok) {
        const text = await res.text()
        if (text) {
          const data = JSON.parse(text)
          setStats(data)
        }
      }
    } catch (e) {
      console.error('Erreur lors du chargement des stats:', e)
      // Garder les valeurs par défaut en cas d'erreur
    }
  }

  // Charger les administrateurs d'écoles
  const loadAdmins = async () => {
    try {
      setLoadingAdmins(true)
      const res = await fetch('/api/super-admin/admins', {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setAdmins(data.admins || [])
      } else {
        console.error('Erreur API admins:', res.status, await res.text())
        setAdmins([])
      }
    } catch (e) {
      console.error('Erreur lors du chargement des admins:', e)
      setAdmins([])
    } finally {
      setLoadingAdmins(false)
    }
  }

  // Activer/Désactiver un administrateur
  const handleToggleAdmin = async (adminId: number, newStatus: boolean) => {
    try {
      setTogglingAdmin(adminId)
      const res = await fetch(`/api/super-admin/admins/${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: newStatus })
      })
      
      if (res.ok) {
        // Recharger la liste des admins pour voir le changement
        await loadAdmins()
      } else {
        const data = await res.json().catch(() => ({}))
        console.error('Erreur lors du toggle admin:', data.error || res.statusText)
        setError(data.error || 'Impossible de modifier le statut de l\'administrateur')
      }
    } catch (e: any) {
      console.error('Erreur toggle admin:', e)
      setError('Une erreur est survenue lors de la modification du statut')
    } finally {
      setTogglingAdmin(null)
    }
  }

  // Créer un administrateur d'école
  const handleCreateAdmin = async () => {
    try {
      setCreatingAdmin(true)
      setError("")

      // Validation
      if (!adminForm.schoolId || !adminForm.nom || !adminForm.prenom || !adminForm.email) {
        setError("Veuillez remplir tous les champs obligatoires")
        return
      }

      const res = await fetch('/api/super-admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(adminForm)
      })

      const data = await res.json()

      if (res.ok) {
        setGeneratedCredentials({
          email: data.email,
          password: data.password
        })
        setShowCreateAdminModal(false)
        
        // Afficher le modal de succès avec confettis
        setShowAdminSuccess(true)
        
        // Après 3 secondes, fermer le succès et montrer les identifiants
        setTimeout(() => {
          setShowAdminSuccess(false)
          setTimeout(() => {
            setShowCredentialsModal(true)
          }, 300)
        }, 3000)
        
        loadAdmins()
      } else {
        setError(data.error || "Erreur lors de la création")
      }
    } catch (e) {
      console.error(e)
      setError("Une erreur est survenue")
    } finally {
      setCreatingAdmin(false)
    }
  }

  // Charger le compteur de notifications
  const loadUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications/count', {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setUnreadNotifications(data.count)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Charger le compteur au démarrage et toutes les 5 minutes
  useEffect(() => {
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Fermer le menu utilisateur quand on clique dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const handleLogoutClick = () => {
    setShowUserMenu(false)
    setShowLogoutModal(true)
  }

  const confirmLogout = async () => {
    try {
      setLoggingOut(true)
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      localStorage.removeItem('token')
      // Attendre un peu pour montrer l'animation
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/super-admin/login')
    } catch (e) {
      console.error(e)
      setLoggingOut(false)
    }
  }

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark")
  }

  // Modal animation effects
  useEffect(() => {
    if (showCreateModal) {
      setModalMounted(true)
      setCurrentStep(1)
      const id = setTimeout(() => setModalVisible(true), 10)
      return () => clearTimeout(id)
    }
    setModalVisible(false)
    const t = setTimeout(() => {
      setModalMounted(false)
      // Reset form when modal closes
      setForm({
        nomEtablissement: "",
        typeEtablissement: "PRIVE",
        niveauEnseignement: [],
        codeEtablissement: "",
        anneeCreation: "",
        slogan: "",
        adresse: "",
        ville: "",
        province: "",
        pays: "RDC",
        telephone: "",
        email: "",
        siteWeb: "",
        directeurNom: "",
        directeurTelephone: "",
        directeurEmail: "",
        secretaireAcademique: "",
        comptable: "",
        personnelAdministratifTotal: "",
        rccm: "",
        idNat: "",
        nif: "",
        agrementMinisteriel: "",
        dateAgrement: "",
        cycles: "",
        nombreClasses: "",
        nombreEleves: "",
        nombreEnseignants: "",
        langueEnseignement: "",
        programmes: "",
        joursOuverture: "",
        formule: "Basic"
      })
    }, 220)
    return () => clearTimeout(t)
  }, [showCreateModal])

  // Animation pour le modal admin
  useEffect(() => {
    if (showCreateAdminModal) {
      setAdminModalMounted(true)
      const t = setTimeout(() => setAdminModalVisible(true), 10)
      return () => clearTimeout(t)
    } else {
      setAdminModalVisible(false)
      const t = setTimeout(() => {
        setAdminModalMounted(false)
        // Réinitialiser le formulaire
        setAdminForm({
          schoolId: "",
          nom: "",
          prenom: "",
          email: "",
          telephone: "",
          fonction: "Directeur"
        })
      }, 220)
      return () => clearTimeout(t)
    }
  }, [showCreateAdminModal])

  // Détecter les changements dans le formulaire d'édition
  useEffect(() => {
    if (showEditModal && initialFormData) {
      const changed = JSON.stringify(form) !== JSON.stringify(initialFormData)
      console.log('🔍 Change detection:', { changed, form, initialFormData })
      setHasChanges(changed)
    }
  }, [form, initialFormData, showEditModal])

  const handleNextStep = (e?: React.FormEvent) => {
    e?.preventDefault()
    setError("")
    const errors: Record<string, boolean> = {}
    
    // Validation par étape
    if (currentStep === 1) {
      if (!form.nomEtablissement.trim()) {
        errors.nomEtablissement = true
      }
    } else if (currentStep === 2) {
      if (!form.adresse.trim()) errors.adresse = true
      if (!form.ville.trim()) errors.ville = true
      if (!form.province.trim()) errors.province = true
      if (!form.telephone.trim()) errors.telephone = true
      if (!form.email.trim()) {
        errors.email = true
      } else {
        // Validation email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(form.email)) {
          errors.email = true
        }
      }
    } else if (currentStep === 3) {
      if (!form.directeurNom.trim()) errors.directeurNom = true
      if (!form.directeurTelephone.trim()) errors.directeurTelephone = true
    }
    
    // Si des erreurs, les afficher et arrêter
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    
    // Sinon, nettoyer les erreurs et passer à l'étape suivante
    setFieldErrors({})
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      setError("")
      setFieldErrors({})
    }
  }

  // Navigation sans validation pour le mode édition avec transitions
  const handleEditNextStep = () => {
    setError("")
    setFieldErrors({})
    if (currentStep < 6) {
      setIsEditTransitioning(true)
      setTimeout(() => {
        setCurrentStep(prev => prev + 1)
        setTimeout(() => setIsEditTransitioning(false), 10)
      }, 150)
    }
  }

  const handleEditPrevStep = () => {
    if (currentStep > 1) {
      setIsEditTransitioning(true)
      setTimeout(() => {
        setCurrentStep(prev => prev - 1)
        setError("")
        setFieldErrors({})
        setTimeout(() => setIsEditTransitioning(false), 10)
      }, 150)
    }
  }

  const clearFieldError = (fieldName: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }

  const handleViewDetails = (school: School) => {
    router.push(`/super-admin/schools/${school.id}`)
  }

  const handleEditClick = (school: School) => {
    setSelectedSchool(school)
    // Remplir le formulaire avec les données de l'école
    const s = school as any // Cast pour éviter les erreurs TypeScript
    const formData = {
      nomEtablissement: s.nomEtablissement || "",
      typeEtablissement: s.typeEtablissement || "PRIVE",
      niveauEnseignement: [],
      codeEtablissement: s.codeEtablissement || "",
      anneeCreation: s.anneeCreation || "",
      slogan: s.slogan || "",
      adresse: s.adresse || "",
      ville: s.ville || "",
      province: s.province || "",
      pays: s.pays || "RDC",
      telephone: s.telephone || "",
      email: s.email || "",
      siteWeb: s.siteWeb || "",
      directeurNom: s.directeurNom || "",
      directeurTelephone: s.directeurTelephone || "",
      directeurEmail: s.directeurEmail || "",
      secretaireAcademique: s.secretaireAcademique || "",
      comptable: s.comptable || "",
      personnelAdministratifTotal: s.personnelAdministratifTotal || "",
      rccm: s.rccm || "",
      idNat: s.idNat || "",
      nif: s.nif || "",
      agrementMinisteriel: s.agrementMinisteriel || "",
      dateAgrement: s.dateAgrement || "",
      cycles: s.cycles || "",
      nombreClasses: s.nombreClasses?.toString() || "",
      nombreEleves: s.nombreEleves?.toString() || "",
      nombreEnseignants: s.nombreEnseignants?.toString() || "",
      langueEnseignement: s.langueEnseignement || "",
      programmes: s.programmes || "",
      joursOuverture: s.joursOuverture || "",
      formule: "Basic" as "Basic" | "Premium" | "Enterprise"
    }
    setForm(formData)
    setInitialFormData({ ...formData })
    setHasChanges(false)
    setCurrentStep(1)
    setShowEditModal(true)
  }

  const handleDeleteClick = (school: School) => {
    setSelectedSchool(school)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!selectedSchool) return
    
    try {
      setDeleting(true)
      const res = await fetch(`/api/super-admin/schools/${selectedSchool.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        
        // Vérifier si c'est une erreur d'authentification
        if (res.status === 401 || res.status === 403) {
          alert('Votre session a expiré. Veuillez vous reconnecter.')
          router.push('/super-admin/login')
          return
        }
        
        throw new Error(errorData.error || 'Erreur lors de la suppression')
      }
      
      // Recharger la liste des écoles
      await loadSchools()
      setShowDeleteModal(false)
      setSelectedSchool(null)
    } catch (e: any) {
      console.error('Delete error:', e)
      alert(e.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleUpdateSchool = async () => {
    if (!selectedSchool) return
    
    try {
      setCreating(true)
      setError("")
      
      console.log('📤 Envoi de la mise à jour:', form)
      
      const res = await fetch(`/api/super-admin/schools/${selectedSchool.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      })
      
      console.log('📥 Response status:', res.status)
      const data = await res.json()
      console.log('📥 Response data:', data)
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          alert('Votre session a expiré. Veuillez vous reconnecter.')
          router.push('/super-admin/login')
          return
        }
        throw new Error(data.error || 'Erreur lors de la mise à jour')
      }
      
      // Recharger la liste des écoles
      await loadSchools()
      
      // Réinitialiser les états
      setShowEditModal(false)
      setSelectedSchool(null)
      setInitialFormData(null)
      setHasChanges(false)
      
      setIsEditSuccess(true)
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setIsEditSuccess(false)
      }, 3000)
    } catch (e: any) {
      console.error('❌ Update error:', e)
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleCreate = async () => {
    console.log('🚀 Début création école...', form)
    setCreating(true)
    setError("")
    try {
      const res = await fetch('/api/super-admin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include'
      })
      console.log('📡 Réponse API:', res.status)
      const data = await res.json()
      console.log('📦 Données reçues:', data)
      
      if (!res.ok) {
        console.error('❌ Erreur API:', data.error)
        
        // Si non authentifié, rediriger vers la page de connexion
        if (res.status === 401 || res.status === 403) {
          alert('Session expirée. Vous allez être redirigé vers la page de connexion.')
          router.push('/super-admin/login')
          return
        }
        
        throw new Error(data.error || 'Erreur')
      }
      
      console.log('✅ École créée avec succès!')
      // Afficher le succès avec animation
      setShowSuccess(true)
      await loadSchools()
      
      // Fermer après 3 secondes
      setTimeout(() => {
        setShowSuccess(false)
        setShowCreateModal(false)
        setCurrentStep(1)
        setForm({
          nomEtablissement: "", typeEtablissement: "PRIVE" as "PUBLIC" | "PRIVE" | "SEMI_PRIVE",
          niveauEnseignement: [] as string[], codeEtablissement: "", anneeCreation: "", slogan: "",
          adresse: "", ville: "", province: "", pays: "RDC", telephone: "", email: "", siteWeb: "",
          directeurNom: "", directeurTelephone: "", directeurEmail: "",
          secretaireAcademique: "", comptable: "", personnelAdministratifTotal: "",
          rccm: "", idNat: "", nif: "", agrementMinisteriel: "", dateAgrement: "",
          cycles: "", nombreClasses: "", nombreEleves: "", nombreEnseignants: "",
          langueEnseignement: "", programmes: "", joursOuverture: "",
          formule: "Basic" as "Basic" | "Premium" | "Enterprise"
        })
      }, 3000)
    } catch (e: any) {
      console.error('💥 Erreur lors de la création:', e)
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const getModifiedFields = () => {
    if (!initialFormData) return []
    
    const changes: Array<{ section: string; label: string; oldValue: any; newValue: any }> = []
    
    const fieldLabels: Record<string, { section: string; label: string }> = {
      nomEtablissement: { section: 'Informations générales', label: 'Nom établissement' },
      typeEtablissement: { section: 'Informations générales', label: 'Type' },
      codeEtablissement: { section: 'Informations générales', label: 'Code' },
      anneeCreation: { section: 'Informations générales', label: 'Année création' },
      slogan: { section: 'Informations générales', label: 'Slogan' },
      adresse: { section: 'Localisation', label: 'Adresse' },
      ville: { section: 'Localisation', label: 'Ville' },
      province: { section: 'Localisation', label: 'Province' },
      pays: { section: 'Localisation', label: 'Pays' },
      telephone: { section: 'Contact', label: 'Téléphone' },
      email: { section: 'Contact', label: 'Email' },
      siteWeb: { section: 'Contact', label: 'Site web' },
      directeurNom: { section: 'Direction', label: 'Nom directeur' },
      directeurTelephone: { section: 'Direction', label: 'Tél. directeur' },
      directeurEmail: { section: 'Direction', label: 'Email directeur' },
      secretaireAcademique: { section: 'Personnel', label: 'Secrétaire académique' },
      comptable: { section: 'Personnel', label: 'Comptable' },
      personnelAdministratifTotal: { section: 'Personnel', label: 'Personnel administratif' },
      rccm: { section: 'Informations légales', label: 'RCCM' },
      idNat: { section: 'Informations légales', label: 'ID National' },
      nif: { section: 'Informations légales', label: 'NIF' },
      agrementMinisteriel: { section: 'Informations légales', label: 'Agrément ministériel' },
      dateAgrement: { section: 'Informations légales', label: 'Date agrément' },
      cycles: { section: 'Académique', label: 'Cycles' },
      nombreClasses: { section: 'Académique', label: 'Nombre de classes' },
      nombreEleves: { section: 'Académique', label: 'Nombre d\'élèves' },
      nombreEnseignants: { section: 'Académique', label: 'Nombre d\'enseignants' },
      langueEnseignement: { section: 'Académique', label: 'Langue d\'enseignement' },
      programmes: { section: 'Académique', label: 'Programmes' },
      joursOuverture: { section: 'Académique', label: 'Jours d\'ouverture' },
    }
    
    Object.keys(fieldLabels).forEach(key => {
      const typedKey = key as keyof typeof form
      if (form[typedKey] !== initialFormData[typedKey]) {
        changes.push({
          section: fieldLabels[key].section,
          label: fieldLabels[key].label,
          oldValue: initialFormData[typedKey] || '-',
          newValue: form[typedKey] || '-'
        })
      }
    })
    
    return changes
  }

  const exportToCSV = () => {
    // Créer les en-têtes
    const headers = ['Section', 'Champ', 'Valeur']
    
    // Collecter les données avec sections
    const dataRows: string[][] = []
    
    // Informations générales
    if (form.nomEtablissement) dataRows.push(['Général', 'Nom établissement', form.nomEtablissement])
    if (form.typeEtablissement) dataRows.push(['Général', 'Type', form.typeEtablissement])
    if (form.codeEtablissement) dataRows.push(['Général', 'Code', form.codeEtablissement])
    if (form.anneeCreation) dataRows.push(['Général', 'Année création', form.anneeCreation])
    if (form.slogan) dataRows.push(['Général', 'Slogan', form.slogan])
    
    // Localisation & Contact
    if (form.adresse) dataRows.push(['Contact', 'Adresse', form.adresse])
    if (form.ville) dataRows.push(['Contact', 'Ville', form.ville])
    if (form.province) dataRows.push(['Contact', 'Province', form.province])
    if (form.telephone) dataRows.push(['Contact', 'Téléphone', form.telephone])
    if (form.email) dataRows.push(['Contact', 'Email', form.email])
    if (form.siteWeb) dataRows.push(['Contact', 'Site web', form.siteWeb])
    
    // Direction
    if (form.directeurNom) dataRows.push(['Direction', 'Directeur', form.directeurNom])
    if (form.directeurTelephone) dataRows.push(['Direction', 'Tél. Directeur', form.directeurTelephone])
    if (form.directeurEmail) dataRows.push(['Direction', 'Email Directeur', form.directeurEmail])
    if (form.secretaireAcademique) dataRows.push(['Direction', 'Secrétaire', form.secretaireAcademique])
    if (form.comptable) dataRows.push(['Direction', 'Comptable', form.comptable])
    if (form.personnelAdministratifTotal) dataRows.push(['Direction', 'Personnel admin.', form.personnelAdministratifTotal])
    
    // Académique
    if (form.cycles) dataRows.push(['Académique', 'Cycles', form.cycles])
    if (form.nombreClasses) dataRows.push(['Académique', 'Nombre classes', form.nombreClasses])
    if (form.nombreEleves) dataRows.push(['Académique', 'Nombre élèves', form.nombreEleves])
    if (form.nombreEnseignants) dataRows.push(['Académique', 'Nombre enseignants', form.nombreEnseignants])
    if (form.langueEnseignement) dataRows.push(['Académique', 'Langue', form.langueEnseignement])
    if (form.programmes) dataRows.push(['Académique', 'Programmes', form.programmes])
    if (form.joursOuverture) dataRows.push(['Académique', 'Jours ouverture', form.joursOuverture])
    
    // Informations légales
    if (form.rccm) dataRows.push(['Légal', 'RCCM', form.rccm])
    if (form.idNat) dataRows.push(['Légal', 'ID National', form.idNat])
    if (form.nif) dataRows.push(['Légal', 'NIF', form.nif])
    if (form.agrementMinisteriel) dataRows.push(['Légal', 'Agrément', form.agrementMinisteriel])
    if (form.dateAgrement) dataRows.push(['Légal', 'Date agrément', form.dateAgrement])
    
    // Abonnement
    if (form.formule) dataRows.push(['Abonnement', 'Formule', form.formule])
    
    // Construire le CSV
    const allRows = [headers, ...dataRows]
    const csv = allRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    
    // Ajouter le BOM pour Excel
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ecole-${form.nomEtablissement.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    // Créer un document HTML propre pour l'impression
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const sections = [
      {
        title: '📋 Informations générales',
        fields: [
          { label: 'Nom établissement', value: form.nomEtablissement },
          { label: 'Type', value: form.typeEtablissement },
          { label: 'Code', value: form.codeEtablissement },
          { label: 'Année création', value: form.anneeCreation },
          { label: 'Slogan', value: form.slogan },
        ]
      },
      {
        title: '📍 Localisation & Contact',
        fields: [
          { label: 'Adresse', value: form.adresse },
          { label: 'Ville', value: form.ville },
          { label: 'Province', value: form.province },
          { label: 'Téléphone', value: form.telephone },
          { label: 'Email', value: form.email },
          { label: 'Site web', value: form.siteWeb },
        ]
      },
      {
        title: '👥 Direction & Personnel',
        fields: [
          { label: 'Directeur', value: form.directeurNom },
          { label: 'Tél. Directeur', value: form.directeurTelephone },
          { label: 'Email Directeur', value: form.directeurEmail },
          { label: 'Secrétaire académique', value: form.secretaireAcademique },
          { label: 'Comptable', value: form.comptable },
          { label: 'Personnel administratif', value: form.personnelAdministratifTotal },
        ]
      },
      {
        title: '📚 Académique',
        fields: [
          { label: 'Cycles', value: form.cycles },
          { label: 'Nombre de classes', value: form.nombreClasses },
          { label: 'Nombre d\'élèves', value: form.nombreEleves },
          { label: 'Nombre d\'enseignants', value: form.nombreEnseignants },
          { label: 'Langue d\'enseignement', value: form.langueEnseignement },
          { label: 'Programmes', value: form.programmes },
          { label: 'Jours d\'ouverture', value: form.joursOuverture },
        ]
      },
      {
        title: '⚖️ Informations légales',
        fields: [
          { label: 'RCCM', value: form.rccm },
          { label: 'ID National', value: form.idNat },
          { label: 'NIF', value: form.nif },
          { label: 'Agrément ministériel', value: form.agrementMinisteriel },
          { label: 'Date agrément', value: form.dateAgrement },
        ]
      },
      {
        title: '💳 Abonnement',
        fields: [
          { label: 'Formule', value: form.formule },
        ]
      }
    ]
    
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>École - ${form.nomEtablissement}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 {
            text-align: center;
            color: #1e40af;
            border-bottom: 3px solid #1e40af;
            padding-bottom: 10px;
            margin-bottom: 30px;
          }
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 2px solid #e5e7eb;
          }
          .field {
            display: flex;
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
          }
          .field-label {
            font-weight: 600;
            color: #374151;
            min-width: 200px;
          }
          .field-value {
            color: #1f2937;
            flex: 1;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
          }
          @media print {
            body { padding: 10px; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>Fiche École - ${form.nomEtablissement || 'Nouvelle École'}</h1>
    `
    
    sections.forEach(section => {
      const filledFields = section.fields.filter(field => field.value)
      if (filledFields.length > 0) {
        htmlContent += `<div class="section">`
        htmlContent += `<div class="section-title">${section.title}</div>`
        filledFields.forEach(field => {
          htmlContent += `
            <div class="field">
              <div class="field-label">${field.label}:</div>
              <div class="field-value">${field.value}</div>
            </div>
          `
        })
        htmlContent += `</div>`
      }
    })
    
    htmlContent += `
        <div class="footer">
          Document généré le ${new Date().toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </body>
      </html>
    `
    
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const filteredSchools = schools.filter(s => 
    s.nomEtablissement.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.codeEtablissement || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.ville.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.directeurNom.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination logic
  const totalPages = Math.ceil(filteredSchools.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSchools = filteredSchools.slice(startIndex, endIndex)

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const tabs = [
    { id: "stats", label: "Statistiques Générales" },
    { id: "schools", label: "Gestion des Écoles" },
    { id: "admins", label: "Administrateurs d'Écoles" },
    { id: "users", label: "Gestion des Utilisateurs" },
    { id: "notifications", label: "Notifications" }
  ]

  const statsCards = [
    { 
      label: "Écoles totales", 
      value: stats.totalSchools.toLocaleString(), 
      change: `+${stats.schoolsGrowth}%`, 
      trend: parseFloat(stats.schoolsGrowth) >= 0 ? "up" : "down", 
      icon: Building2,
      subtitle: `${stats.activeSchools} actives`
    },
    { 
      label: "Utilisateurs totaux", 
      value: stats.totalUsers.toLocaleString(), 
      change: `${stats.totalStudents} élèves`, 
      trend: "up", 
      icon: Users,
      subtitle: `${stats.totalTeachers} enseignants`
    },
    { 
      label: "Classes", 
      value: stats.totalClasses.toLocaleString(), 
      change: `${stats.totalAdmins} admins`, 
      trend: "up", 
      icon: GraduationCap,
      subtitle: "Toutes les écoles"
    },
    { 
      label: "Revenu mensuel", 
      value: `€${stats.monthlyRevenue.toLocaleString()}`, 
      change: `${parseFloat(stats.revenueChange) >= 0 ? "+" : ""}${stats.revenueChange}%`, 
      trend: parseFloat(stats.revenueChange) >= 0 ? "up" : "down", 
      icon: DollarSign,
      subtitle: `${stats.suspendedSchools} suspendues`
    },
  ]

  // Thème colors
  const bgColor = theme === "dark" ? "bg-[#0f1729]" : "bg-gray-100"
  const textColor = theme === "dark" ? "text-white" : "text-gray-900"
  const cardBg = theme === "dark" ? "bg-[#1a2332]" : "bg-white"
  const borderColor = theme === "dark" ? "border-gray-800" : "border-gray-200"
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-600"
  const hoverBg = theme === "dark" ? "hover:bg-[#242f42]" : "hover:bg-gray-50"
  const inputBg = theme === "dark" ? "bg-[#0f1729]" : "bg-gray-50"
  const notificationBg = theme === "dark" ? "hover:bg-[#1a2332]" : "hover:bg-gray-100"

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} p-6 transition-colors duration-300`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-xl ${theme === "dark" ? "bg-blue-500/10" : "bg-blue-50"} flex items-center justify-center`}>
            <Building2 className="w-5 h-5 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold">Tableau de bord Super Admin</h1>
        </div>
        <p className={textSecondary}>Gérez les écoles, les utilisateurs et visualisez les statistiques de la plateforme.</p>
      </div>

      {/* Tabs Navigation */}
      <div className={`mb-6 border-b ${borderColor}`}>
        <div className="flex items-center justify-between">
          {/* Spacer gauche */}
          <div className="flex-1"></div>
          
          {/* Onglets centrés */}
          <div className="flex gap-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setIsTransitioning(true)
                  setTimeout(() => {
                    setActiveTab(tab.id)
                    setTimeout(() => setIsTransitioning(false), 10)
                  }, 150)
                }}
                className={`pb-4 px-1 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? "text-blue-500"
                    : `${textSecondary} ${theme === "dark" ? "hover:text-gray-300" : "hover:text-gray-900"}`
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                )}
              </button>
            ))}
          </div>

          {/* Section droite : Utilisateur et notifications */}
          <div className="flex-1 flex items-center justify-end gap-4 pb-4">
            {/* Notification */}
            <button 
              onClick={() => {
                setIsTransitioning(true)
                setTimeout(() => {
                  setActiveTab("notifications")
                  setTimeout(() => setIsTransitioning(false), 10)
                }, 150)
              }}
              className={`relative p-2 ${notificationBg} rounded-lg transition-colors`}
            >
              <Bell className={`w-5 h-5 ${unreadNotifications > 0 ? 'text-yellow-400 animate-pulse' : textSecondary}`} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-bounce">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>

            {/* Utilisateur */}
            {user && user.name && (
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-3 pl-4 border-l ${borderColor} hover:opacity-80 transition-opacity`}
                >
                  <div className="text-right">
                    <div className={`text-sm font-medium ${textColor}`}>{user.name}</div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      <span className="text-xs text-emerald-500">Connecté</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </button>

                {/* Menu Dropdown */}
                {showUserMenu && (
                  <div className={`absolute right-0 mt-2 w-56 ${cardBg} rounded-lg shadow-xl border ${borderColor} overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200`}>
                    {/* User Info */}
                    <div className={`px-4 py-3 border-b ${borderColor}`}>
                      <div className={`text-sm font-medium ${textColor}`}>{user.name}</div>
                      <div className={`text-xs ${textSecondary}`}>{user.email}</div>
                    </div>

                    {/* Theme Toggle */}
                    <button
                      onClick={toggleTheme}
                      className={`w-full px-4 py-3 flex items-center gap-3 ${hoverBg} transition-colors text-left`}
                    >
                      {theme === "dark" ? (
                        <Sun className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <Moon className="w-5 h-5 text-blue-500" />
                      )}
                      <div>
                        <div className={`text-sm font-medium ${textColor}`}>
                          {theme === "dark" ? "Mode clair" : "Mode sombre"}
                        </div>
                        <div className={`text-xs ${textSecondary}`}>Changer le thème</div>
                      </div>
                    </button>

                    {/* Logout */}
                    <button
                      onClick={handleLogoutClick}
                      className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-red-500/10 transition-colors text-left border-t ${borderColor}`}
                    >
                      <LogOut className="w-5 h-5 text-red-500" />
                      <div>
                        <div className="text-sm font-medium text-red-500">Déconnexion</div>
                        <div className={`text-xs ${textSecondary}`}>Retour à la page login</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className={`transition-all duration-300 ${
        isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      }`}>
      {activeTab === "stats" && (
        <>
      {/* Time Period Filters */}
      <div className="flex gap-2 mb-6">
        {["7", "30", "365"].map((days) => (
          <button
            key={days}
            onClick={() => setPeriod(days)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === days
                ? "bg-blue-500 text-white"
                : `${cardBg} ${textSecondary} ${hoverBg}`
            }`}
          >
            {days === "7" ? "7 derniers jours" : days === "30" ? "30 jours" : "Année en cours"}
          </button>
        ))}
        <button className={`px-4 py-2 rounded-lg text-sm font-medium ${cardBg} ${textSecondary} ${hoverBg}`}>
          Personnalisé
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((stat, i) => (
          <div key={i} className={`${cardBg} rounded-xl p-5 border ${borderColor} shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`${textSecondary} text-sm font-medium`}>{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${
                stat.label === "Revenu mensuel" 
                  ? theme === "dark" ? "text-green-400" : "text-green-500"
                  : theme === "dark" ? "text-blue-400" : "text-blue-500"
              }`} />
            </div>
            <div className={`text-3xl font-bold ${textColor} mb-2`}>{stat.value}</div>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${textSecondary}`}>{stat.subtitle}</span>
              {stat.label === "Revenu mensuel" ? (
                <span className={`text-xs font-medium flex items-center gap-1 ${
                  stat.trend === "up" ? "text-green-500" : "text-red-500"
                }`}>
                  {stat.trend === "down" && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {stat.change}
                </span>
              ) : (
                <span className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  {stat.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Evolution Chart */}
        <div className={`lg:col-span-2 ${cardBg} rounded-xl p-6 border ${borderColor} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-1 ${textColor}`}>Évolution des abonnements</h3>
          <div className="flex items-baseline gap-2 mb-6">
            <span className={`text-3xl font-bold ${textColor}`}>{stats.activeSchools}</span>
            <span className="text-green-500 text-sm font-medium">Actifs {parseFloat(stats.schoolsGrowth) >= 0 ? "+" : ""}{stats.schoolsGrowth}%</span>
            <span className={`${textSecondary} text-sm`}>sur les 30 derniers jours</span>
          </div>
          <div className="h-48 flex items-end justify-between gap-2">
            {[65, 85, 75, 95, 70, 80, 90, 75, 85, 95, 80, 90, 85, 95, 75, 85, 95, 85, 75, 95].map((height, i) => (
              <div 
                key={i} 
                className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-700 ease-out hover:from-blue-600 hover:to-blue-500 cursor-pointer" 
                style={{ 
                  height: `${height}%`,
                  animation: `growBar 0.8s ease-out ${i * 0.05}s forwards`,
                  transform: 'scaleY(0)',
                  transformOrigin: 'bottom'
                }} 
              />
            ))}
          </div>
        </div>

        {/* Distribution Chart */}
        <div className={`${cardBg} rounded-xl p-6 border ${borderColor} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-6 ${textColor}`}>Répartition par formule</h3>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-40 h-40">
              {(() => {
                const total = stats.subscriptionsByPlan.Basic + stats.subscriptionsByPlan.Premium + stats.subscriptionsByPlan.Enterprise
                const basicPercent = total > 0 ? (stats.subscriptionsByPlan.Basic / total) * 100 : 40
                const premiumPercent = total > 0 ? (stats.subscriptionsByPlan.Premium / total) * 100 : 35
                const enterprisePercent = total > 0 ? (stats.subscriptionsByPlan.Enterprise / total) * 100 : 25
                
                const circumference = 440
                const basicDash = (basicPercent / 100) * circumference
                const premiumDash = (premiumPercent / 100) * circumference
                const enterpriseDash = (enterprisePercent / 100) * circumference
                
                return (
                  <svg className="w-full h-full -rotate-90">
                    {/* Background circles */}
                    <circle cx="80" cy="80" r="70" fill="none" stroke={theme === "dark" ? "#1a2332" : "#f3f4f6"} strokeWidth="20" />
                    
                    {/* Animated circles avec transitions - SANS strokeLinecap pour garder les bords carrés */}
                    <circle 
                      cx="80" 
                      cy="80" 
                      r="70" 
                      fill="none" 
                      stroke="#3b82f6" 
                      strokeWidth="20" 
                      strokeDasharray={`${basicDash} ${circumference}`}
                      className="transition-all duration-1000 ease-out"
                      style={{
                        animation: 'drawCircle 1.5s ease-out forwards'
                      }}
                    />
                    <circle 
                      cx="80" 
                      cy="80" 
                      r="70" 
                      fill="none" 
                      stroke="#a855f7" 
                      strokeWidth="20" 
                      strokeDasharray={`${premiumDash} ${circumference}`} 
                      strokeDashoffset={`-${basicDash}`}
                      className="transition-all duration-1000 ease-out"
                      style={{
                        animation: 'drawCircle 1.5s ease-out 0.2s forwards',
                        opacity: 0,
                        animationFillMode: 'forwards'
                      }}
                    />
                    <circle 
                      cx="80" 
                      cy="80" 
                      r="70" 
                      fill="none" 
                      stroke="#ec4899" 
                      strokeWidth="20" 
                      strokeDasharray={`${enterpriseDash} ${circumference}`} 
                      strokeDashoffset={`-${basicDash + premiumDash}`}
                      className="transition-all duration-1000 ease-out"
                      style={{
                        animation: 'drawCircle 1.5s ease-out 0.4s forwards',
                        opacity: 0,
                        animationFillMode: 'forwards'
                      }}
                    />
                  </svg>
                )
              })()}
              <div className="absolute inset-0 flex flex-col items-center justify-center animate-fadeIn">
                <div className={`text-3xl font-bold ${textColor}`}>{stats.activeSchools > 0 ? stats.activeSchools.toLocaleString() : schools.length.toLocaleString()}</div>
                <div className={`text-xs ${textSecondary}`}>Écoles</div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm group cursor-pointer hover:bg-blue-500/5 p-2 rounded-lg transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 group-hover:scale-110 transition-transform"></div>
                <span className={textSecondary}>Basic ({(() => {
                  const total = stats.subscriptionsByPlan.Basic + stats.subscriptionsByPlan.Premium + stats.subscriptionsByPlan.Enterprise
                  return total > 0 ? Math.round((stats.subscriptionsByPlan.Basic / total) * 100) : 40
                })()}%)</span>
              </div>
              <span className={`font-semibold ${textColor}`}>{stats.subscriptionsByPlan.Basic}</span>
            </div>
            <div className="flex items-center justify-between text-sm group cursor-pointer hover:bg-purple-500/5 p-2 rounded-lg transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500 group-hover:scale-110 transition-transform"></div>
                <span className={textSecondary}>Premium ({(() => {
                  const total = stats.subscriptionsByPlan.Basic + stats.subscriptionsByPlan.Premium + stats.subscriptionsByPlan.Enterprise
                  return total > 0 ? Math.round((stats.subscriptionsByPlan.Premium / total) * 100) : 35
                })()}%)</span>
              </div>
              <span className={`font-semibold ${textColor}`}>{stats.subscriptionsByPlan.Premium}</span>
            </div>
            <div className="flex items-center justify-between text-sm group cursor-pointer hover:bg-pink-500/5 p-2 rounded-lg transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500 group-hover:scale-110 transition-transform"></div>
                <span className={textSecondary}>Enterprise ({(() => {
                  const total = stats.subscriptionsByPlan.Basic + stats.subscriptionsByPlan.Premium + stats.subscriptionsByPlan.Enterprise
                  return total > 0 ? Math.round((stats.subscriptionsByPlan.Enterprise / total) * 100) : 25
                })()}%)</span>
              </div>
              <span className={`font-semibold ${textColor}`}>{stats.subscriptionsByPlan.Enterprise}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Types d'établissements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {stats.schoolsByType.map((item, i) => {
          const colors = [
            { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
            { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/20" },
            { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20" }
          ]
          const color = colors[i % colors.length]
          const percentage = stats.totalSchools > 0 ? ((item.count / stats.totalSchools) * 100).toFixed(1) : 0
          
          return (
            <div key={i} className={`${cardBg} rounded-xl p-5 border ${borderColor} shadow-sm`}>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${color.bg} border ${color.border} mb-3`}>
                <Building2 className={`w-4 h-4 ${color.text}`} />
                <span className={`text-sm font-medium ${color.text}`}>{item.type}</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className={`text-3xl font-bold ${textColor}`}>{item.count}</div>
                  <div className={`text-sm ${textSecondary} mt-1`}>{percentage}% du total</div>
                </div>
                <div className={`w-16 h-16 rounded-lg ${color.bg} flex items-center justify-center`}>
                  <span className={`text-2xl font-bold ${color.text}`}>{percentage}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Schools Table */}
      <div className={`${cardBg} rounded-xl border ${borderColor} overflow-hidden shadow-sm`}>
        <div className={`p-6 border-b ${borderColor}`}>
          <h3 className={`text-lg font-semibold ${textColor}`}>Dernières écoles inscrites</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theme === "dark" ? "bg-[#0f1729]" : "bg-gray-50"}>
              <tr className={`text-left text-sm ${textSecondary}`}>
                <th className="px-6 py-4 font-medium">Nom de l'école</th>
                <th className="px-6 py-4 font-medium">Date d'inscription</th>
                <th className="px-6 py-4 font-medium">Formule</th>
                <th className="px-6 py-4 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${borderColor}`}>
              {loading ? (
                <tr><td colSpan={4} className={`px-6 py-8 text-center ${textSecondary}`}>Chargement...</td></tr>
              ) : schools.length === 0 ? (
                <tr><td colSpan={4} className={`px-6 py-8 text-center ${textSecondary}`}>Aucune école enregistrée</td></tr>
              ) : (
                schools.slice(0, 5).map((school) => (
                  <tr key={school.id} className={`${hoverBg} transition-colors`}>
                    <td className="px-6 py-4">
                      <div className={`font-medium ${textColor}`}>{school.nomEtablissement}</div>
                      <div className={`text-sm ${textSecondary}`}>Code: {school.codeEtablissement || "N/A"}</div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${textSecondary}`}>
                      {new Date(school.dateCreation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {school.typeEtablissement}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        school.etatCompte === "ACTIF" ? "bg-green-500/10 text-green-500" :
                        school.etatCompte === "EN_ATTENTE" ? "bg-yellow-500/10 text-yellow-500" :
                        "bg-red-500/10 text-red-500"
                      }`}>
                        • {school.etatCompte === "ACTIF" ? "Actif" : school.etatCompte === "EN_ATTENTE" ? "En attente" : "Suspendu"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Schools Tab */}
      {activeTab === "schools" && (
        <div>
          {/* Search and Create Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${textSecondary}`} />
              <Input autoComplete="off" type="text"
                placeholder="Rechercher une école..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${inputBg} border ${borderColor} rounded-lg pl-10 pr-4 py-2.5 ${textColor} ${theme === "dark" ? "placeholder-gray-500" : "placeholder-gray-400"} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                theme === "dark" 
                  ? "bg-[#21262d] hover:bg-[#30363d] text-gray-200 border border-gray-600/50 hover:border-gray-500 shadow-sm" 
                  : "bg-[#f6f8fa] hover:bg-[#f3f4f6] text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm"
              }`}
            >
              <Plus className="w-4 h-4" />
              Nouvelle école
            </button>
          </div>

          {/* Schools Table */}
          <div className={`${cardBg} rounded-xl border ${borderColor} overflow-hidden shadow-sm`}>
            <table className="w-full">
              <thead className={theme === "dark" ? "bg-[#0f1729]" : "bg-gray-50"}>
                <tr className={`text-left text-sm ${textSecondary}`}>
                  <th className="px-6 py-4 font-medium">Nom de l'école</th>
                  <th className="px-6 py-4 font-medium">Date d'inscription</th>
                  <th className="px-6 py-4 font-medium">Formule</th>
                  <th className="px-6 py-4 font-medium">Statut de l'abonnement</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${borderColor}`}>
                {loading ? (
                  <tr><td colSpan={5} className={`px-6 py-8 text-center ${textSecondary}`}>Chargement...</td></tr>
                ) : filteredSchools.length === 0 ? (
                  <tr><td colSpan={5} className={`px-6 py-8 text-center ${textSecondary}`}>
                    {searchQuery ? "Aucune école trouvée" : "Aucune école enregistrée"}
                  </td></tr>
                ) : (
                  paginatedSchools.map((school) => (
                    <tr key={school.id} className={`${hoverBg} transition-colors`}>
                      <td className="px-6 py-4">
                        <div className={`font-medium ${textColor}`}>{school.nomEtablissement}</div>
                        <div className={`text-sm ${textSecondary}`}>Code: {school.codeEtablissement || "N/A"}</div>
                      </td>
                      <td className={`px-6 py-4 text-sm ${textSecondary}`}>
                        {new Date(school.dateCreation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className={`px-6 py-4 text-sm ${textColor}`}>
                        {school.typeEtablissement}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          school.etatCompte === "ACTIF" ? "bg-green-500/10 text-green-500" :
                          school.etatCompte === "EN_ATTENTE" ? "bg-yellow-500/10 text-yellow-500" :
                          "bg-red-500/10 text-red-500"
                        }`}>
                          • {school.etatCompte === "ACTIF" ? "Actif" : school.etatCompte === "EN_ATTENTE" ? "En attente" : "Suspendu"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleViewDetails(school)}
                            className={`p-1.5 rounded-md transition-all ${
                              theme === "dark" 
                                ? "text-gray-400 hover:text-blue-400 bg-[#21262d] hover:bg-[#30363d] border border-gray-700/50 hover:border-blue-500/50" 
                                : "text-gray-600 hover:text-blue-600 bg-[#f6f8fa] hover:bg-[#f3f4f6] border border-gray-300 hover:border-blue-400"
                            }`} 
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditClick(school)}
                            className={`p-1.5 rounded-md transition-all ${
                              theme === "dark" 
                                ? "text-gray-400 hover:text-gray-200 bg-[#21262d] hover:bg-[#30363d] border border-gray-700/50 hover:border-gray-600" 
                                : "text-gray-600 hover:text-gray-800 bg-[#f6f8fa] hover:bg-[#f3f4f6] border border-gray-300 hover:border-gray-400"
                            }`} 
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(school)}
                            className={`p-1.5 rounded-md transition-all ${
                              theme === "dark" 
                                ? "text-gray-400 hover:text-red-400 bg-[#21262d] hover:bg-[#30363d] border border-gray-700/50 hover:border-red-500/50" 
                                : "text-gray-600 hover:text-red-600 bg-[#f6f8fa] hover:bg-[#f3f4f6] border border-gray-300 hover:border-red-400"
                            }`}
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredSchools.length > 0 && (
            <div className={`px-6 py-4 border-t ${borderColor} flex items-center justify-between`}>
              {/* Info */}
              <div className={`text-sm ${textSecondary}`}>
                Affichage de <span className={`font-medium ${textColor}`}>{startIndex + 1}</span> à{' '}
                <span className={`font-medium ${textColor}`}>{Math.min(endIndex, filteredSchools.length)}</span> sur{' '}
                <span className={`font-medium ${textColor}`}>{filteredSchools.length}</span> écoles
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-2">
                {/* Items per page selector */}
                <div className="flex items-center gap-2 mr-4">
                  <span className={`text-sm ${textSecondary}`}>Par page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className={`px-2 py-1 text-sm rounded-md border ${
                      theme === "dark"
                        ? "bg-[#0f1729] border-gray-700 text-gray-300"
                        : "bg-white border-gray-300 text-gray-700"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* Previous Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-all ${
                    currentPage === 1
                      ? theme === "dark"
                        ? "bg-[#21262d] border-gray-800 text-gray-600 cursor-not-allowed"
                        : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                      : theme === "dark"
                      ? "bg-[#21262d] hover:bg-[#30363d] border-gray-700 text-gray-300 hover:border-gray-600"
                      : "bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  Précédent
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first page, last page, current page and adjacent pages
                      return (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                    })
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center gap-1">
                        {/* Show ellipsis if there's a gap */}
                        {index > 0 && page > array[index - 1] + 1 && (
                          <span className={`px-2 ${textSecondary}`}>...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-md transition-all ${
                            page === currentPage
                              ? theme === "dark"
                                ? "bg-blue-600 text-white border border-blue-600"
                                : "bg-blue-600 text-white border border-blue-600"
                              : theme === "dark"
                              ? "bg-[#21262d] hover:bg-[#30363d] border border-gray-700 text-gray-300 hover:border-gray-600"
                              : "bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 hover:border-gray-400"
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-all ${
                    currentPage === totalPages
                      ? theme === "dark"
                        ? "bg-[#21262d] border-gray-800 text-gray-600 cursor-not-allowed"
                        : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                      : theme === "dark"
                      ? "bg-[#21262d] hover:bg-[#30363d] border-gray-700 text-gray-300 hover:border-gray-600"
                      : "bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {/* Copyright */}
          <div className={`px-6 py-4 border-t ${borderColor} text-center`}>
            <p className={`text-sm ${textSecondary}`}>
              © {new Date().getFullYear()} <span className="font-semibold">School Management System</span>. 
              Tous droits réservés. Développé avec ❤️ par <span className="font-semibold">Becker Baraka-Bilali</span>
            </p>
          </div>
        </div>
      )}

      {/* Admins Tab */}
      {activeTab === "admins" && (() => {
        // Filtrage des admins
        let filteredAdmins = admins.filter(admin => {
          // Filtre par recherche
          const searchLower = adminSearchQuery.toLowerCase()
          const matchesSearch = !adminSearchQuery || 
            admin.nom?.toLowerCase().includes(searchLower) ||
            admin.prenom?.toLowerCase().includes(searchLower) ||
            admin.email.toLowerCase().includes(searchLower) ||
            admin.telephone?.toLowerCase().includes(searchLower)
          
          // Filtre par école
          const matchesSchool = adminFilterSchool === "all" || 
            admin.schoolId === parseInt(adminFilterSchool)
          
          return matchesSearch && matchesSchool
        })

        // Pagination
        const totalPages = Math.ceil(filteredAdmins.length / adminsPerPage)
        const startIndex = (adminCurrentPage - 1) * adminsPerPage
        const endIndex = startIndex + adminsPerPage
        const paginatedAdmins = filteredAdmins.slice(startIndex, endIndex)

        return (
        <div>
          {/* Header avec bouton */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-2xl font-bold ${textColor}`}>Administrateurs d'Écoles</h2>
              <p className={`${textSecondary} text-sm mt-1`}>Gérez les administrateurs et leurs identifiants de connexion</p>
            </div>
            <button
              onClick={() => setShowCreateAdminModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Créer un administrateur
            </button>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Barre de recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email ou téléphone..."
                  value={adminSearchQuery}
                  onChange={(e) => {
                    setAdminSearchQuery(e.target.value)
                    setAdminCurrentPage(1) // Reset à la page 1 lors d'une recherche
                  }}
                  className={`w-full pl-10 pr-4 py-2.5 ${cardBg} border ${borderColor} rounded-lg ${textColor} placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>

            {/* Filtre par école */}
            <div className="md:w-64">
              <select
                value={adminFilterSchool}
                onChange={(e) => {
                  setAdminFilterSchool(e.target.value)
                  setAdminCurrentPage(1) // Reset à la page 1 lors d'un filtrage
                }}
                className={`w-full px-4 py-2.5 ${cardBg} border ${borderColor} rounded-lg ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="all">Toutes les écoles</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>
                    {school.nomEtablissement}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Liste des administrateurs */}
          <div className={`${cardBg} rounded-xl border ${borderColor} overflow-hidden shadow-sm`}>
            <table className="w-full">
              <thead className={theme === "dark" ? "bg-[#0f1729]" : "bg-gray-50"}>
                <tr className={`text-left text-sm ${textSecondary}`}>
                  <th className="px-6 py-4 font-medium">Administrateur</th>
                  <th className="px-6 py-4 font-medium">École</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Téléphone</th>
                  <th className="px-6 py-4 font-medium">Statut</th>
                  <th className="px-6 py-4 font-medium text-center">Activer/Désactiver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loadingAdmins ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className={textSecondary}>Chargement...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <UserCheck className={`w-12 h-12 ${textSecondary} mx-auto mb-3 opacity-50`} />
                      <p className={`${textSecondary} text-sm`}>
                        {adminSearchQuery || adminFilterSchool !== "all" 
                          ? "Aucun administrateur ne correspond aux critères de recherche" 
                          : "Aucun administrateur créé"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedAdmins.map((admin) => (
                    <tr key={admin.id} className={`${hoverBg} transition-colors`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${theme === "dark" ? "bg-blue-500/20" : "bg-blue-100"} flex items-center justify-center`}>
                            <span className={`text-sm font-semibold ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
                              {admin.prenom?.[0]}{admin.nom?.[0]}
                            </span>
                          </div>
                          <div>
                            <div className={`font-medium ${textColor}`}>{admin.prenom} {admin.nom}</div>
                            <div className={`text-xs ${textSecondary}`}>Administrateur</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`font-medium ${textColor}`}>{admin.school?.nomEtablissement || "N/A"}</div>
                        <div className={`text-xs ${textSecondary}`}>{admin.school?.ville}, {admin.school?.province}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm ${textColor} font-mono`}>{admin.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm ${textColor}`}>{admin.telephone || "-"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          admin.isActive
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {admin.isActive ? "ACTIF" : "INACTIF"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleToggleAdmin(admin.id, !admin.isActive)}
                            disabled={togglingAdmin === admin.id}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              togglingAdmin === admin.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                            style={{ backgroundColor: admin.isActive ? '#10b981' : '#ef4444' }}
                            title={admin.isActive ? 'Cliquez pour désactiver' : 'Cliquez pour activer'}
                          >
                            <span 
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                admin.isActive ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredAdmins.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className={`text-sm ${textSecondary}`}>
                Affichage de {startIndex + 1} à {Math.min(endIndex, filteredAdmins.length)} sur {filteredAdmins.length} administrateur{filteredAdmins.length > 1 ? 's' : ''}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAdminCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={adminCurrentPage === 1}
                  className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                    adminCurrentPage === 1
                      ? theme === "dark"
                        ? "bg-[#21262d] border-gray-800 text-gray-600 cursor-not-allowed"
                        : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                      : theme === "dark"
                      ? "bg-[#21262d] hover:bg-[#30363d] border-gray-700 text-gray-300 hover:border-gray-600"
                      : "bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  Précédent
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => setAdminCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        adminCurrentPage === pageNum
                          ? "bg-blue-500 text-white"
                          : theme === "dark"
                          ? "bg-[#21262d] hover:bg-[#30363d] border border-gray-700 text-gray-300"
                          : "bg-white hover:bg-gray-50 border border-gray-300 text-gray-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setAdminCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={adminCurrentPage === totalPages}
                  className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                    adminCurrentPage === totalPages
                      ? theme === "dark"
                        ? "bg-[#21262d] border-gray-800 text-gray-600 cursor-not-allowed"
                        : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                      : theme === "dark"
                      ? "bg-[#21262d] hover:bg-[#30363d] border-gray-700 text-gray-300 hover:border-gray-600"
                      : "bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
        )
      })()}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className={`${cardBg} rounded-xl border ${borderColor} p-8 text-center shadow-sm`}>
          <Users className={`w-16 h-16 ${textSecondary} mx-auto mb-4`} />
          <h3 className={`text-xl font-semibold mb-2 ${textColor}`}>Gestion des Utilisateurs</h3>
          <p className={textSecondary}>Cette section est en cours de développement.</p>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <NotificationsSection theme={theme} />
      )}

      {/* Create School Modal */}
      {modalMounted && (
        <Portal>
          <div 
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 overflow-y-auto ${
              modalVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={!modalVisible}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
            
            <div 
              className={`relative w-full max-w-5xl my-8 rounded-xl ${cardBg} border ${borderColor} shadow-2xl transform transition-all duration-200 max-h-[90vh] flex flex-col ${
                modalVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
              role="dialog"
              aria-modal="true"
            >
              {/* Header avec étapes */}
              <div className={`px-6 py-4 border-b ${borderColor} flex-shrink-0`}>
                <h2 className={`text-lg font-semibold ${textColor} mb-2`}>Création d'une nouvelle école</h2>
                <p className={`text-xs ${textSecondary} mb-4`}>Suivez les étapes pour configurer une nouvelle école sur la plateforme.</p>
                
                {/* Steps indicator */}
                <div className="flex items-center justify-between">
                  {[
                    { num: 1, label: "Général", Icon: Building2 },
                    { num: 2, label: "Contact", Icon: MapPin },
                    { num: 3, label: "Direction", Icon: UserCheck },
                    { num: 4, label: "Académique", Icon: GraduationCap },
                    { num: 5, label: "Abonnement", Icon: CreditCard },
                    { num: 6, label: "Récapitulatif", Icon: FileText }
                  ].map((step, idx) => (
                    <div key={step.num} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-semibold transition-colors ${
                          currentStep >= step.num 
                            ? "bg-blue-500 text-white" 
                            : `${theme === "dark" ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500"}`
                        }`}>
                          <step.Icon className="w-3 h-3" />
                        </div>
                        <span className={`text-[8px] mt-1 text-center ${currentStep >= step.num ? "text-blue-500 font-medium" : textSecondary}`}>
                          {step.label}
                        </span>
                      </div>
                      {idx < 5 && (
                        <div className={`h-0.5 flex-1 mx-0.5 -mt-4 ${
                          currentStep > step.num ? "bg-blue-500" : `${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <form onSubmit={handleNextStep} autoComplete="off" className="flex flex-col flex-1 overflow-hidden">
                {/* Content scrollable */}
                <div className="overflow-y-auto flex-1 px-6 py-4">
                {/* Étape 1: Informations Générales */}
                {currentStep === 1 && (
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Nom de l'établissement *</label>
                      <Input 
                        value={form.nomEtablissement}
                        onChange={(e) => {
                          setForm(prev => ({ ...prev, nomEtablissement: e.target.value }))
                          clearFieldError('nomEtablissement')
                        }}
                        autoComplete="off"
                        className={`h-9 text-sm ${inputBg} ${
                          fieldErrors.nomEtablissement 
                            ? "border-red-400/60 border-2" 
                            : theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"
                        }`}
                        placeholder="Ex: Lycée Victor Hugo"
                      />
                      {fieldErrors.nomEtablissement && (
                        <p className="text-[10px] text-red-400/80 mt-1">Ce champ est requis</p>
                      )}
                    </div>
                    
                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Type d'établissement *</label>
                      <select
                        value={form.typeEtablissement}
                        onChange={(e) => setForm(prev => ({ ...prev, typeEtablissement: e.target.value as any }))}
                        required
                        className={`w-full h-9 px-3 text-sm rounded-lg ${inputBg} border ${borderColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="PRIVE">École privée</option>
                        <option value="PUBLIC">École publique</option>
                        <option value="SEMI_PRIVE">École semi-privée</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Année de création</label>
                        <select
                          value={form.anneeCreation}
                          onChange={(e) => setForm(prev => ({ ...prev, anneeCreation: e.target.value }))}
                          className={`w-full h-9 px-3 text-sm rounded-lg ${inputBg} border ${borderColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          <option value="">Sélectionner une année</option>
                          {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Code établissement</label>
                        <Input autoComplete="off" value={form.codeEtablissement}
                          onChange={(e) => setForm(prev => ({ ...prev, codeEtablissement: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Ex: LVH2024"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Description</label>
                      <textarea
                        value={form.slogan}
                        onChange={(e) => setForm(prev => ({ ...prev, slogan: e.target.value }))}
                        className={`w-full px-3 py-2 text-sm rounded-lg ${inputBg} border ${borderColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] resize-none`}
                        placeholder="Brève description de l'école"
                      />
                    </div>
                  </div>
                )}

                {/* Étape 2: Coordonnées */}
                {currentStep === 2 && (
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Adresse *</label>
                      <Input autoComplete="off" value={form.adresse}
                        onChange={(e) => {
                          setForm(prev => ({ ...prev, adresse: e.target.value }))
                          clearFieldError('adresse')
                        }}
                        className={`h-9 text-sm ${inputBg} ${
                          fieldErrors.adresse 
                            ? "border-red-400/60 border-2" 
                            : theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"
                        }`}
                        placeholder="Ex: 123 Avenue de la Liberté"
                      />
                      {fieldErrors.adresse && (
                        <p className="text-[10px] text-red-400/80 mt-1">Ce champ est requis</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Ville *</label>
                        <Input autoComplete="off" value={form.ville}
                          onChange={(e) => {
                            setForm(prev => ({ ...prev, ville: e.target.value }))
                            clearFieldError('ville')
                          }}
                          className={`h-9 text-sm ${inputBg} ${
                            fieldErrors.ville 
                              ? "border-red-400/60 border-2" 
                              : theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"
                          }`}
                          placeholder="Ex: Kinshasa"
                        />
                        {fieldErrors.ville && (
                          <p className="text-[10px] text-red-400/80 mt-1">Ce champ est requis</p>
                        )}
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Province *</label>
                        <select
                          value={form.province}
                          onChange={(e) => {
                            setForm(prev => ({ ...prev, province: e.target.value }))
                            clearFieldError('province')
                          }}
                          className={`h-9 w-full text-sm rounded-md px-3 ${inputBg} ${
                            fieldErrors.province 
                              ? "border-red-400/60 border-2" 
                              : theme === "dark" ? "border border-gray-700 text-white" : "border border-gray-300 text-gray-900"
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          <option value="">Sélectionner une province</option>
                          <option value="Kinshasa">Kinshasa</option>
                          <option value="Kongo-Central">Kongo-Central</option>
                          <option value="Kwango">Kwango</option>
                          <option value="Kwilu">Kwilu</option>
                          <option value="Mai-Ndombe">Mai-Ndombe</option>
                          <option value="Kasaï">Kasaï</option>
                          <option value="Kasaï-Central">Kasaï-Central</option>
                          <option value="Kasaï-Oriental">Kasaï-Oriental</option>
                          <option value="Lomami">Lomami</option>
                          <option value="Sankuru">Sankuru</option>
                          <option value="Maniema">Maniema</option>
                          <option value="Sud-Kivu">Sud-Kivu</option>
                          <option value="Nord-Kivu">Nord-Kivu</option>
                          <option value="Ituri">Ituri</option>
                          <option value="Haut-Uele">Haut-Uele</option>
                          <option value="Tshopo">Tshopo</option>
                          <option value="Bas-Uele">Bas-Uele</option>
                          <option value="Nord-Ubangi">Nord-Ubangi</option>
                          <option value="Mongala">Mongala</option>
                          <option value="Sud-Ubangi">Sud-Ubangi</option>
                          <option value="Équateur">Équateur</option>
                          <option value="Tshuapa">Tshuapa</option>
                          <option value="Tanganyika">Tanganyika</option>
                          <option value="Haut-Lomami">Haut-Lomami</option>
                          <option value="Lualaba">Lualaba</option>
                          <option value="Haut-Katanga">Haut-Katanga</option>
                        </select>
                        {fieldErrors.province && (
                          <p className="text-[10px] text-red-400/80 mt-1">Ce champ est requis</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Téléphone *</label>
                        <Input autoComplete="off" value={form.telephone}
                          onChange={(e) => {
                            setForm(prev => ({ ...prev, telephone: e.target.value }))
                            clearFieldError('telephone')
                          }}
                          className={`h-9 text-sm ${inputBg} ${
                            fieldErrors.telephone 
                              ? "border-red-400/60 border-2" 
                              : theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"
                          }`}
                          placeholder="+243 XXX XXX XXX"
                        />
                        {fieldErrors.telephone && (
                          <p className="text-[10px] text-red-400/80 mt-1">Ce champ est requis</p>
                        )}
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Email *</label>
                        <Input autoComplete="off" type="email"
                          value={form.email}
                          onChange={(e) => {
                            setForm(prev => ({ ...prev, email: e.target.value }))
                            clearFieldError('email')
                          }}
                          className={`h-9 text-sm ${inputBg} ${
                            fieldErrors.email 
                              ? "border-red-400/60 border-2" 
                              : theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"
                          }`}
                          placeholder="contact@ecole.cd"
                        />
                        {fieldErrors.email && (
                          <p className="text-[10px] text-red-400/80 mt-1">{form.email ? "Email invalide" : "Ce champ est requis"}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Site Web</label>
                      <Input autoComplete="off" value={form.siteWeb}
                        onChange={(e) => setForm(prev => ({ ...prev, siteWeb: e.target.value }))}
                        className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                        placeholder="https://www.ecole.cd"
                      />
                    </div>
                  </div>
                )}

                {/* Étape 3: Direction & Personnel */}
                {currentStep === 3 && (
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Nom du directeur *</label>
                      <Input autoComplete="off" value={form.directeurNom}
                        onChange={(e) => {
                          setForm(prev => ({ ...prev, directeurNom: e.target.value }))
                          clearFieldError('directeurNom')
                        }}
                        className={`h-9 text-sm ${inputBg} ${
                          fieldErrors.directeurNom 
                            ? "border-red-400/60 border-2" 
                            : theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"
                        }`}
                        placeholder="Nom complet du directeur"
                      />
                      {fieldErrors.directeurNom && (
                        <p className="text-[10px] text-red-400/80 mt-1">Ce champ est requis</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Téléphone directeur *</label>
                        <Input autoComplete="off" value={form.directeurTelephone}
                          onChange={(e) => {
                            setForm(prev => ({ ...prev, directeurTelephone: e.target.value }))
                            clearFieldError('directeurTelephone')
                          }}
                          className={`h-9 text-sm ${inputBg} ${
                            fieldErrors.directeurTelephone 
                              ? "border-red-400/60 border-2" 
                              : theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"
                          }`}
                          placeholder="+243 XXX XXX XXX"
                        />
                        {fieldErrors.directeurTelephone && (
                          <p className="text-[10px] text-red-400/80 mt-1">Ce champ est requis</p>
                        )}
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Email directeur</label>
                        <Input autoComplete="off" type="email"
                          value={form.directeurEmail}
                          onChange={(e) => setForm(prev => ({ ...prev, directeurEmail: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="directeur@ecole.cd"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Secrétaire académique</label>
                        <Input autoComplete="off" value={form.secretaireAcademique}
                          onChange={(e) => setForm(prev => ({ ...prev, secretaireAcademique: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Nom du secrétaire"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Comptable</label>
                        <Input autoComplete="off" value={form.comptable}
                          onChange={(e) => setForm(prev => ({ ...prev, comptable: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Nom du comptable"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Personnel administratif total</label>
                      <Input autoComplete="off" type="number"
                        value={form.personnelAdministratifTotal}
                        onChange={(e) => setForm(prev => ({ ...prev, personnelAdministratifTotal: e.target.value }))}
                        className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                        placeholder="Ex: 15"
                      />
                    </div>

                    <div className={`pt-2 pb-1 border-t ${borderColor}`}>
                      <h4 className={`text-xs font-semibold ${textColor}`}>Informations légales</h4>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>RCCM</label>
                        <Input autoComplete="off" value={form.rccm}
                          onChange={(e) => setForm(prev => ({ ...prev, rccm: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="CD/XXX/XXX"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>ID National</label>
                        <Input autoComplete="off" value={form.idNat}
                          onChange={(e) => setForm(prev => ({ ...prev, idNat: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="ID Nat."
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>NIF</label>
                        <Input autoComplete="off" value={form.nif}
                          onChange={(e) => setForm(prev => ({ ...prev, nif: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="NIF"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Agrément ministériel</label>
                        <Input autoComplete="off" value={form.agrementMinisteriel}
                          onChange={(e) => setForm(prev => ({ ...prev, agrementMinisteriel: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="N° Agrément"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Date agrément</label>
                        <Input autoComplete="off" type="date"
                          value={form.dateAgrement}
                          onChange={(e) => setForm(prev => ({ ...prev, dateAgrement: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Étape 4: Informations académiques */}
                {currentStep === 4 && (
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Cycles d'enseignement</label>
                      <Input autoComplete="off" value={form.cycles}
                        onChange={(e) => setForm(prev => ({ ...prev, cycles: e.target.value }))}
                        className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                        placeholder="Ex: Maternel, Primaire, Secondaire"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Nombre de classes</label>
                        <Input autoComplete="off" type="number"
                          value={form.nombreClasses}
                          onChange={(e) => setForm(prev => ({ ...prev, nombreClasses: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Ex: 24"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Nombre d'élèves</label>
                        <Input autoComplete="off" type="number"
                          value={form.nombreEleves}
                          onChange={(e) => setForm(prev => ({ ...prev, nombreEleves: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Ex: 600"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Nombre d'enseignants</label>
                        <Input autoComplete="off" type="number"
                          value={form.nombreEnseignants}
                          onChange={(e) => setForm(prev => ({ ...prev, nombreEnseignants: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Ex: 35"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Langue d'enseignement</label>
                        <Input autoComplete="off" value={form.langueEnseignement}
                          onChange={(e) => setForm(prev => ({ ...prev, langueEnseignement: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Ex: Français"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Jours d'ouverture</label>
                        <Input autoComplete="off" value={form.joursOuverture}
                          onChange={(e) => setForm(prev => ({ ...prev, joursOuverture: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Ex: Lundi - Vendredi"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Programmes</label>
                      <textarea
                        value={form.programmes}
                        onChange={(e) => setForm(prev => ({ ...prev, programmes: e.target.value }))}
                        className={`w-full px-3 py-2 text-sm rounded-lg ${inputBg} border ${borderColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] resize-none`}
                        placeholder="Programmes d'enseignement suivis"
                      />
                    </div>
                  </div>
                )}

                {/* Étape 5: Abonnement */}
                {currentStep === 5 && (
                  <div className="space-y-3">
                    <h4 className={`text-sm font-semibold ${textColor} mb-3`}>Choisissez une formule d'abonnement</h4>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { name: "Basic", price: "50$", features: ["10 utilisateurs", "Support email", "Stockage 5GB"] },
                        { name: "Premium", price: "150$", features: ["50 utilisateurs", "Support prioritaire", "Stockage 50GB"] },
                        { name: "Enterprise", price: "300$", features: ["Utilisateurs illimités", "Support 24/7", "Stockage illimité"] }
                      ].map((plan) => (
                        <div
                          key={plan.name}
                          onClick={() => setForm(prev => ({ ...prev, formule: plan.name as any }))}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            form.formule === plan.name
                              ? "border-blue-500 bg-blue-500/10"
                              : `${borderColor} ${hoverBg}`
                          }`}
                        >
                          <h5 className={`text-sm font-semibold ${textColor} mb-1`}>{plan.name}</h5>
                          <p className="text-xl font-bold text-blue-500 mb-2">{plan.price}/mois</p>
                          <ul className={`space-y-0.5 text-[11px] ${textSecondary}`}>
                            {plan.features.map((f, i) => (
                              <li key={i}>✓ {f}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Étape 6: Récapitulatif */}
                {currentStep === 6 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className={`text-sm font-semibold ${textColor}`}>Récapitulatif des informations</h4>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={exportToCSV}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all flex items-center gap-1.5 ${
                            theme === "dark"
                              ? "bg-[#21262d] hover:bg-[#30363d] border-gray-700/50 hover:border-gray-600 text-gray-400 hover:text-gray-200"
                              : "bg-[#f6f8fa] hover:bg-[#f3f4f6] border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800"
                          }`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          Export CSV
                        </button>
                        <button
                          type="button"
                          onClick={handlePrint}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all flex items-center gap-1.5 ${
                            theme === "dark"
                              ? "bg-[#21262d] hover:bg-[#30363d] border-gray-700/50 hover:border-gray-600 text-gray-400 hover:text-gray-200"
                              : "bg-[#f6f8fa] hover:bg-[#f3f4f6] border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800"
                          }`}
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Imprimer
                        </button>
                      </div>
                    </div>

                    <div className={`grid grid-cols-2 gap-4 p-4 rounded-lg ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"}`}>
                      <div>
                        <h5 className={`text-xs font-semibold ${textColor} mb-2 flex items-center gap-2`}>
                          <Building2 className="w-4 h-4" /> Informations générales
                        </h5>
                        <div className={`space-y-1 text-xs ${textSecondary}`}>
                          <p><span className="font-medium">Nom:</span> {form.nomEtablissement || "-"}</p>
                          <p><span className="font-medium">Type:</span> {form.typeEtablissement || "-"}</p>
                          <p><span className="font-medium">Code:</span> {form.codeEtablissement || "-"}</p>
                          <p><span className="font-medium">Année:</span> {form.anneeCreation || "-"}</p>
                        </div>
                      </div>

                      <div>
                        <h5 className={`text-xs font-semibold ${textColor} mb-2 flex items-center gap-2`}>
                          <MapPin className="w-4 h-4" /> Localisation
                        </h5>
                        <div className={`space-y-1 text-xs ${textSecondary}`}>
                          <p><span className="font-medium">Adresse:</span> {form.adresse || "-"}</p>
                          <p><span className="font-medium">Ville:</span> {form.ville || "-"}</p>
                          <p><span className="font-medium">Province:</span> {form.province || "-"}</p>
                          <p><span className="font-medium">Téléphone:</span> {form.telephone || "-"}</p>
                          <p><span className="font-medium">Email:</span> {form.email || "-"}</p>
                        </div>
                      </div>

                      <div>
                        <h5 className={`text-xs font-semibold ${textColor} mb-2 flex items-center gap-2`}>
                          <UserCheck className="w-4 h-4" /> Direction
                        </h5>
                        <div className={`space-y-1 text-xs ${textSecondary}`}>
                          <p><span className="font-medium">Directeur:</span> {form.directeurNom || "-"}</p>
                          <p><span className="font-medium">Tél:</span> {form.directeurTelephone || "-"}</p>
                          <p><span className="font-medium">Secrétaire:</span> {form.secretaireAcademique || "-"}</p>
                          <p><span className="font-medium">Comptable:</span> {form.comptable || "-"}</p>
                        </div>
                      </div>

                      <div>
                        <h5 className={`text-xs font-semibold ${textColor} mb-2 flex items-center gap-2`}>
                          <GraduationCap className="w-4 h-4" /> Académique
                        </h5>
                        <div className={`space-y-1 text-xs ${textSecondary}`}>
                          <p><span className="font-medium">Classes:</span> {form.nombreClasses || "-"}</p>
                          <p><span className="font-medium">Élèves:</span> {form.nombreEleves || "-"}</p>
                          <p><span className="font-medium">Enseignants:</span> {form.nombreEnseignants || "-"}</p>
                          <p><span className="font-medium">Langue:</span> {form.langueEnseignement || "-"}</p>
                        </div>
                      </div>

                      <div>
                        <h5 className={`text-xs font-semibold ${textColor} mb-2 flex items-center gap-2`}>
                          <FileText className="w-4 h-4" /> Légal
                        </h5>
                        <div className={`space-y-1 text-xs ${textSecondary}`}>
                          <p><span className="font-medium">RCCM:</span> {form.rccm || "-"}</p>
                          <p><span className="font-medium">ID Nat:</span> {form.idNat || "-"}</p>
                          <p><span className="font-medium">NIF:</span> {form.nif || "-"}</p>
                          <p><span className="font-medium">Agrément:</span> {form.agrementMinisteriel || "-"}</p>
                        </div>
                      </div>

                      <div>
                        <h5 className={`text-xs font-semibold ${textColor} mb-2 flex items-center gap-2`}>
                          <CreditCard className="w-4 h-4" /> Abonnement
                        </h5>
                        <div className={`space-y-1 text-xs ${textSecondary}`}>
                          <p><span className="font-medium">Formule:</span> {form.formule}</p>
                          <p><span className="font-medium">Prix:</span> {
                            form.formule === "Basic" ? "50$/mois" :
                            form.formule === "Premium" ? "150$/mois" :
                            "300$/mois"
                          }</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              <div className={`flex items-center justify-between pt-4 border-t ${borderColor} px-6 pb-4`}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    theme === "dark"
                      ? "text-gray-400 hover:text-gray-200 bg-[#21262d] hover:bg-[#30363d] border border-gray-700/50 hover:border-gray-600"
                      : "text-gray-600 hover:text-gray-800 bg-[#f6f8fa] hover:bg-[#f3f4f6] border border-gray-300 hover:border-gray-400"
                  }`}
                >
                  Annuler
                </button>

                <div className="flex gap-2">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={creating}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-all ${
                        theme === "dark"
                          ? "bg-[#21262d] hover:bg-[#30363d] border-gray-700/50 hover:border-gray-600 text-gray-300 hover:text-gray-100"
                          : "bg-[#f6f8fa] hover:bg-[#f3f4f6] border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      ← Précédent
                    </button>
                  )}
                  
                  {currentStep < 6 ? (
                    <button
                      type="submit"
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        theme === "dark"
                          ? "bg-[#238636] hover:bg-[#2ea043] text-white border border-[#238636]/50 shadow-sm"
                          : "bg-[#2da44e] hover:bg-[#2c974b] text-white border border-[#1a7f37] shadow-sm"
                      }`}
                    >
                      Suivant →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={creating}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        theme === "dark"
                          ? "bg-[#238636] hover:bg-[#2ea043] text-white border border-[#238636]/50 shadow-sm"
                          : "bg-[#2da44e] hover:bg-[#2c974b] text-white border border-[#1a7f37] shadow-sm"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {creating ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></div>
                          Création...
                        </>
                      ) : (
                        "Créer l'école"
                      )}
                    </button>
                  )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Success Modal with Confetti */}
      {showSuccess && (
        <Portal>
          <div className="fixed inset-0 z-[60] flex items-center justify-center animate-in fade-in duration-200">
            {/* Confetti animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-fall"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-20px`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                >
                  {['🎉', '🎊', '✨', '🌟', '💫'][Math.floor(Math.random() * 5)]}
                </div>
              ))}
            </div>

            <div className="absolute inset-0 bg-black/50" />
            
            <div className={`relative ${cardBg} rounded-xl p-8 shadow-2xl max-w-md w-full mx-4 border ${borderColor} transform scale-100 animate-bounce-in`}>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <div className="text-5xl animate-scale-up">🎉</div>
                </div>
                <h3 className={`text-2xl font-bold ${textColor} mb-2`}>
                  {isEditSuccess ? "École modifiée avec succès !" : "École créée avec succès !"}
                </h3>
                <p className={`text-sm ${textSecondary} mb-4`}>
                  L'école <span className="font-semibold text-green-500">{form.nomEtablissement}</span> a été {isEditSuccess ? "modifiée" : "enregistrée"} dans le système.
                </p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${theme === "dark" ? "bg-green-500/10" : "bg-green-50"} text-green-500 text-sm`}>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Fermeture automatique...
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/50" onClick={() => !loggingOut && setShowLogoutModal(false)} />
            
            <div className={`relative w-full max-w-md rounded-xl ${cardBg} border ${borderColor} shadow-2xl p-6 animate-in zoom-in-95 duration-200`}>
              {loggingOut ? (
                // Loading state
                <div className="text-center py-8">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                    <LogOut className="absolute inset-0 m-auto w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${textColor}`}>Déconnexion en cours...</h3>
                  <p className={textSecondary}>Veuillez patienter</p>
                </div>
              ) : (
                // Confirmation state
                <>
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                      <LogOut className="w-8 h-8 text-red-500" />
                    </div>
                  </div>
                  
                  <h3 className={`text-xl font-semibold text-center mb-2 ${textColor}`}>
                    Voulez-vous vous déconnecter ?
                  </h3>
                  <p className={`text-center mb-6 ${textSecondary}`}>
                    Vous serez redirigé vers la page de connexion.
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowLogoutModal(false)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md border transition-all ${
                        theme === "dark"
                          ? "bg-[#21262d] hover:bg-[#30363d] border-gray-700/50 hover:border-gray-600 text-gray-300 hover:text-gray-100"
                          : "bg-[#f6f8fa] hover:bg-[#f3f4f6] border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900"
                      }`}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={confirmLogout}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all shadow-sm ${
                        theme === "dark"
                          ? "bg-[#da3633] hover:bg-[#b52f2c] text-white border border-[#da3633]/50"
                          : "bg-[#cf222e] hover:bg-[#a40e26] text-white border border-[#cf222e]"
                      }`}
                    >
                      Déconnexion
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Détails École */}
      {showDetailsModal && selectedSchool && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200" onClick={() => setShowDetailsModal(false)}>
            <div 
              className={`${theme === "dark" ? "bg-gray-900" : "bg-white"} rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200`}
              onClick={e => e.stopPropagation()}
            >
              <div className={`sticky top-0 ${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"} border-b px-6 py-4 flex items-center justify-between z-10`}>
                <div>
                  <h2 className={`text-xl font-bold ${textColor}`}>Détails de l'école</h2>
                  <p className={`text-sm ${textSecondary} mt-1`}>{selectedSchool.nomEtablissement}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className={`p-2 rounded-md transition-all ${
                    theme === "dark"
                      ? "hover:bg-gray-800 text-gray-400 hover:text-gray-200"
                      : "hover:bg-gray-100 text-gray-600 hover:text-gray-800"
                  }`}
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Informations générales */}
                <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"}`}>
                  <h3 className={`text-sm font-semibold ${textColor} mb-3 flex items-center gap-2`}>
                    <Building2 className="w-4 h-4" /> Informations générales
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className={textSecondary}>Nom:</span>
                      <p className={textColor + " font-medium"}>{selectedSchool.nomEtablissement}</p>
                    </div>
                    {selectedSchool.codeEtablissement && (
                      <div>
                        <span className={textSecondary}>Code:</span>
                        <p className={textColor + " font-medium"}>{selectedSchool.codeEtablissement}</p>
                      </div>
                    )}
                    <div>
                      <span className={textSecondary}>Type:</span>
                      <p className={textColor + " font-medium"}>{selectedSchool.typeEtablissement}</p>
                    </div>
                    <div>
                      <span className={textSecondary}>État:</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        selectedSchool.etatCompte === "ACTIF" ? "bg-green-500/10 text-green-500" :
                        selectedSchool.etatCompte === "EN_ATTENTE" ? "bg-yellow-500/10 text-yellow-500" :
                        "bg-red-500/10 text-red-500"
                      }`}>
                        • {selectedSchool.etatCompte === "ACTIF" ? "Actif" : selectedSchool.etatCompte === "EN_ATTENTE" ? "En attente" : "Suspendu"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Localisation */}
                <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"}`}>
                  <h3 className={`text-sm font-semibold ${textColor} mb-3 flex items-center gap-2`}>
                    <MapPin className="w-4 h-4" /> Localisation
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className={textSecondary}>Ville:</span>
                      <p className={textColor + " font-medium"}>{selectedSchool.ville}</p>
                    </div>
                    <div>
                      <span className={textSecondary}>Province:</span>
                      <p className={textColor + " font-medium"}>{selectedSchool.province}</p>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"}`}>
                  <h3 className={`text-sm font-semibold ${textColor} mb-3 flex items-center gap-2`}>
                    <FileText className="w-4 h-4" /> Contact
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className={textSecondary}>Téléphone:</span>
                      <p className={textColor + " font-medium"}>{selectedSchool.telephone}</p>
                    </div>
                    <div>
                      <span className={textSecondary}>Email:</span>
                      <p className={textColor + " font-medium"}>{selectedSchool.email}</p>
                    </div>
                  </div>
                </div>

                {/* Direction */}
                <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"}`}>
                  <h3 className={`text-sm font-semibold ${textColor} mb-3 flex items-center gap-2`}>
                    <UserCheck className="w-4 h-4" /> Direction
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className={textSecondary}>Directeur:</span>
                      <p className={textColor + " font-medium"}>{selectedSchool.directeurNom}</p>
                    </div>
                    <div>
                      <span className={textSecondary}>Date création:</span>
                      <p className={textColor + " font-medium"}>{new Date(selectedSchool.dateCreation).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`sticky bottom-0 ${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"} border-t px-6 py-4 flex justify-end gap-3`}>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    theme === "dark"
                      ? "bg-[#21262d] hover:bg-[#30363d] border border-gray-700/50 hover:border-gray-600 text-gray-300 hover:text-gray-100"
                      : "bg-[#f6f8fa] hover:bg-[#f3f4f6] border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900"
                  }`}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && selectedSchool && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200" onClick={() => !deleting && setShowDeleteModal(false)}>
            <div 
              className={`${theme === "dark" ? "bg-gray-900" : "bg-white"} rounded-lg shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200`}
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  theme === "dark" ? "bg-red-500/10" : "bg-red-50"
                }`}>
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className={`text-lg font-bold ${textColor} mb-2`}>
                  Supprimer l'école
                </h3>
                <p className={`text-sm ${textSecondary} mb-6`}>
                  Êtes-vous sûr de vouloir supprimer <span className="font-semibold">{selectedSchool.nomEtablissement}</span> ?
                  <br />Cette action est irréversible.
                </p>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md border transition-all ${
                      theme === "dark"
                        ? "bg-[#21262d] hover:bg-[#30363d] border-gray-700/50 hover:border-gray-600 text-gray-300 hover:text-gray-100"
                        : "bg-[#f6f8fa] hover:bg-[#f3f4f6] border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleting}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all shadow-sm ${
                      theme === "dark"
                        ? "bg-[#da3633] hover:bg-[#b52f2c] text-white border border-[#da3633]/50"
                        : "bg-[#cf222e] hover:bg-[#a40e26] text-white border border-[#cf222e]"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {deleting ? "Suppression..." : "Supprimer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Modification (réutilise le même modal que création) */}
      {showEditModal && selectedSchool && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200" onClick={() => !creating && setShowEditModal(false)}>
            <div 
              className={`${theme === "dark" ? "bg-gray-900" : "bg-white"} rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200`}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`flex items-center justify-between px-6 py-4 border-b ${borderColor}`}>
                <div>
                  <h2 className={`text-xl font-bold ${textColor}`}>Modifier l'école</h2>
                  <p className={`text-sm ${textSecondary} mt-1`}>Étape {currentStep} sur 6</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setInitialFormData(null)
                    setHasChanges(false)
                  }}
                  disabled={creating}
                  className={`p-2 rounded-md transition-colors ${hoverBg} ${textSecondary} disabled:opacity-50`}
                >
                  ✕
                </button>
              </div>

              {/* Progress bar */}
              <div className={`h-2 ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${(currentStep / 6) * 100}%` }}
                />
              </div>

              {/* Body - Formulaire de modification */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className={`transition-all duration-300 ${
                  isEditTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                }`}>
                {/* Étape 1: Informations Générales */}
                {currentStep === 1 && (
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Nom de l'établissement *</label>
                      <Input 
                        value={form.nomEtablissement}
                        onChange={(e) => {
                          setForm(prev => ({ ...prev, nomEtablissement: e.target.value }))
                          clearFieldError('nomEtablissement')
                        }}
                        autoComplete="off"
                        className={`h-9 text-sm ${inputBg} ${
                          fieldErrors.nomEtablissement 
                            ? "border-red-400/60 border-2" 
                            : theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"
                        }`}
                        placeholder="Ex: Lycée Victor Hugo"
                      />
                      {fieldErrors.nomEtablissement && (
                        <p className="text-[10px] text-red-400/80 mt-1">Ce champ est requis</p>
                      )}
                    </div>
                    
                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Type d'établissement *</label>
                      <select
                        value={form.typeEtablissement}
                        onChange={(e) => setForm(prev => ({ ...prev, typeEtablissement: e.target.value as any }))}
                        required
                        className={`w-full h-9 px-3 text-sm rounded-lg ${inputBg} border ${borderColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="PRIVE">École privée</option>
                        <option value="PUBLIC">École publique</option>
                        <option value="SEMI_PRIVE">École semi-privée</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Année de création</label>
                        <select
                          value={form.anneeCreation}
                          onChange={(e) => setForm(prev => ({ ...prev, anneeCreation: e.target.value }))}
                          className={`w-full h-9 px-3 text-sm rounded-lg ${inputBg} border ${borderColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          <option value="">Sélectionner une année</option>
                          {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Code établissement</label>
                        <Input autoComplete="off" value={form.codeEtablissement}
                          onChange={(e) => setForm(prev => ({ ...prev, codeEtablissement: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Ex: LVH2024"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Description</label>
                      <textarea
                        value={form.slogan}
                        onChange={(e) => setForm(prev => ({ ...prev, slogan: e.target.value }))}
                        className={`w-full px-3 py-2 text-sm rounded-lg ${inputBg} border ${borderColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] resize-none`}
                        placeholder="Brève description de l'école"
                      />
                    </div>
                  </div>
                )}

                {/* Étape 2: Coordonnées */}
                {currentStep === 2 && (
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Adresse</label>
                      <Input autoComplete="off" value={form.adresse}
                        onChange={(e) => setForm(prev => ({ ...prev, adresse: e.target.value }))}
                        className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                        placeholder="Ex: 123 Avenue de la Liberté"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Ville</label>
                        <Input autoComplete="off" value={form.ville}
                          onChange={(e) => setForm(prev => ({ ...prev, ville: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Ex: Kinshasa"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Province</label>
                        <select
                          value={form.province}
                          onChange={(e) => setForm(prev => ({ ...prev, province: e.target.value }))}
                          className={`h-9 w-full text-sm rounded-md px-3 ${inputBg} ${theme === "dark" ? "border border-gray-700 text-white" : "border border-gray-300 text-gray-900"} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          <option value="">Sélectionner une province</option>
                          <option value="Kinshasa">Kinshasa</option>
                          <option value="Kongo-Central">Kongo-Central</option>
                          <option value="Kwango">Kwango</option>
                          <option value="Kwilu">Kwilu</option>
                          <option value="Mai-Ndombe">Mai-Ndombe</option>
                          <option value="Kasaï">Kasaï</option>
                          <option value="Kasaï-Central">Kasaï-Central</option>
                          <option value="Kasaï-Oriental">Kasaï-Oriental</option>
                          <option value="Lomami">Lomami</option>
                          <option value="Sankuru">Sankuru</option>
                          <option value="Maniema">Maniema</option>
                          <option value="Sud-Kivu">Sud-Kivu</option>
                          <option value="Nord-Kivu">Nord-Kivu</option>
                          <option value="Ituri">Ituri</option>
                          <option value="Haut-Uele">Haut-Uele</option>
                          <option value="Tshopo">Tshopo</option>
                          <option value="Bas-Uele">Bas-Uele</option>
                          <option value="Nord-Ubangi">Nord-Ubangi</option>
                          <option value="Mongala">Mongala</option>
                          <option value="Sud-Ubangi">Sud-Ubangi</option>
                          <option value="Équateur">Équateur</option>
                          <option value="Tshuapa">Tshuapa</option>
                          <option value="Tanganyika">Tanganyika</option>
                          <option value="Haut-Lomami">Haut-Lomami</option>
                          <option value="Lualaba">Lualaba</option>
                          <option value="Haut-Katanga">Haut-Katanga</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Téléphone</label>
                        <Input autoComplete="off" value={form.telephone}
                          onChange={(e) => setForm(prev => ({ ...prev, telephone: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="+243 XX XXX XXXX"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Email</label>
                        <Input autoComplete="off" type="email" value={form.email}
                          onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="contact@ecole.cd"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Site web</label>
                      <Input autoComplete="off" value={form.siteWeb}
                        onChange={(e) => setForm(prev => ({ ...prev, siteWeb: e.target.value }))}
                        className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                        placeholder="https://www.ecole.cd"
                      />
                    </div>
                  </div>
                )}

                {/* Étape 3: Direction */}
                {currentStep === 3 && (
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Nom du directeur</label>
                      <Input autoComplete="off" value={form.directeurNom}
                        onChange={(e) => setForm(prev => ({ ...prev, directeurNom: e.target.value }))}
                        className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                        placeholder="Ex: Jean Dupont"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Téléphone directeur</label>
                        <Input autoComplete="off" value={form.directeurTelephone}
                          onChange={(e) => setForm(prev => ({ ...prev, directeurTelephone: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="+243 XX XXX XXXX"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Email directeur</label>
                        <Input autoComplete="off" type="email" value={form.directeurEmail}
                          onChange={(e) => setForm(prev => ({ ...prev, directeurEmail: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="directeur@ecole.cd"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Secrétaire académique</label>
                        <Input autoComplete="off" value={form.secretaireAcademique}
                          onChange={(e) => setForm(prev => ({ ...prev, secretaireAcademique: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Nom du secrétaire"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Comptable</label>
                        <Input autoComplete="off" value={form.comptable}
                          onChange={(e) => setForm(prev => ({ ...prev, comptable: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Nom du comptable"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Personnel administratif total</label>
                      <Input autoComplete="off" type="number" value={form.personnelAdministratifTotal}
                        onChange={(e) => setForm(prev => ({ ...prev, personnelAdministratifTotal: e.target.value }))}
                        className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                        placeholder="Ex: 15"
                      />
                    </div>
                  </div>
                )}

                {/* Étape 4: Informations légales */}
                {currentStep === 4 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>RCCM</label>
                        <Input autoComplete="off" value={form.rccm}
                          onChange={(e) => setForm(prev => ({ ...prev, rccm: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Numéro RCCM"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>ID National</label>
                        <Input autoComplete="off" value={form.idNat}
                          onChange={(e) => setForm(prev => ({ ...prev, idNat: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Numéro ID National"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>NIF</label>
                        <Input autoComplete="off" value={form.nif}
                          onChange={(e) => setForm(prev => ({ ...prev, nif: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Numéro NIF"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Agrément ministériel</label>
                        <Input autoComplete="off" value={form.agrementMinisteriel}
                          onChange={(e) => setForm(prev => ({ ...prev, agrementMinisteriel: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Numéro agrément"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Date d'agrément</label>
                      <Input autoComplete="off" type="date" value={form.dateAgrement}
                        onChange={(e) => setForm(prev => ({ ...prev, dateAgrement: e.target.value }))}
                        className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                      />
                    </div>
                  </div>
                )}

                {/* Étape 5: Informations académiques */}
                {currentStep === 5 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Cycles d'enseignement</label>
                        <Input autoComplete="off" value={form.cycles}
                          onChange={(e) => setForm(prev => ({ ...prev, cycles: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Ex: Primaire, Secondaire"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Nombre de classes</label>
                        <Input autoComplete="off" type="number" value={form.nombreClasses}
                          onChange={(e) => setForm(prev => ({ ...prev, nombreClasses: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Ex: 12"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Nombre d'élèves</label>
                        <Input autoComplete="off" type="number" value={form.nombreEleves}
                          onChange={(e) => setForm(prev => ({ ...prev, nombreEleves: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Ex: 450"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Nombre d'enseignants</label>
                        <Input autoComplete="off" type="number" value={form.nombreEnseignants}
                          onChange={(e) => setForm(prev => ({ ...prev, nombreEnseignants: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Ex: 25"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Langue d'enseignement</label>
                        <Input autoComplete="off" value={form.langueEnseignement}
                          onChange={(e) => setForm(prev => ({ ...prev, langueEnseignement: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Ex: Français"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Jours d'ouverture</label>
                        <Input autoComplete="off" value={form.joursOuverture}
                          onChange={(e) => setForm(prev => ({ ...prev, joursOuverture: e.target.value }))}
                          className={`h-9 text-sm ${inputBg} ${theme === "dark" ? "border-gray-700 text-white" : "border-gray-300 text-gray-900 dark:!text-white"}`}
                          placeholder="Ex: Lundi - Vendredi"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-medium ${textColor} mb-1.5`}>Programmes enseignés</label>
                      <textarea
                        value={form.programmes}
                        onChange={(e) => setForm(prev => ({ ...prev, programmes: e.target.value }))}
                        className={`w-full px-3 py-2 text-sm rounded-lg ${inputBg} border ${borderColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] resize-none`}
                        placeholder="Ex: Programme national congolais"
                      />
                    </div>
                  </div>
                )}

                {/* Étape 6: Récapitulatif */}
                {currentStep === 6 && (
                  <div className="space-y-4">
                    <p className={`text-sm ${textSecondary} mb-4`}>
                      Vérifiez les modifications avant de mettre à jour l'école.
                    </p>
                    
                    {(() => {
                      const modifiedFields = getModifiedFields()
                      
                      if (modifiedFields.length === 0) {
                        return (
                          <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"} text-center`}>
                            <p className={`text-sm ${textSecondary}`}>Aucune modification détectée</p>
                          </div>
                        )
                      }
                      
                      // Grouper les modifications par section
                      const groupedChanges = modifiedFields.reduce((acc, field) => {
                        if (!acc[field.section]) acc[field.section] = []
                        acc[field.section].push(field)
                        return acc
                      }, {} as Record<string, typeof modifiedFields>)
                      
                      return Object.entries(groupedChanges).map(([section, fields]) => (
                        <div key={section} className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800/50" : "bg-gray-50"}`}>
                          <h4 className={`text-sm font-semibold ${textColor} mb-3`}>{section}</h4>
                          <div className="space-y-2">
                            {fields.map((field, idx) => (
                              <div key={idx} className="text-sm">
                                <p className={`font-medium ${textColor} mb-1`}>{field.label}</p>
                                <div className="flex items-center gap-2 ml-2">
                                  <div className="flex-1">
                                    <span className={`text-xs ${textSecondary}`}>Ancienne valeur: </span>
                                    <span className={`text-xs ${theme === "dark" ? "text-red-400" : "text-red-600"} line-through`}>
                                      {field.oldValue}
                                    </span>
                                  </div>
                                  <span className={textSecondary}>→</span>
                                  <div className="flex-1">
                                    <span className={`text-xs ${textSecondary}`}>Nouvelle valeur: </span>
                                    <span className={`text-xs ${theme === "dark" ? "text-green-400" : "text-green-600"} font-medium`}>
                                      {field.newValue}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                )}
                </div>
              </div>

              {/* Footer */}
              <div className={`flex items-center justify-between pt-4 border-t ${borderColor} px-6 pb-4`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setInitialFormData(null)
                    setHasChanges(false)
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    theme === "dark"
                      ? "text-gray-400 hover:text-gray-200 bg-[#21262d] hover:bg-[#30363d] border border-gray-700/50 hover:border-gray-600"
                      : "text-gray-600 hover:text-gray-800 bg-[#f6f8fa] hover:bg-[#f3f4f6] border border-gray-300 hover:border-gray-400"
                  }`}
                >
                  Annuler
                </button>

                <div className="flex gap-2">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handleEditPrevStep}
                      disabled={creating}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-all ${
                        theme === "dark"
                          ? "bg-[#21262d] hover:bg-[#30363d] border-gray-700/50 hover:border-gray-600 text-gray-300 hover:text-gray-100"
                          : "bg-[#f6f8fa] hover:bg-[#f3f4f6] border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      ← Précédent
                    </button>
                  )}
                  
                  {currentStep < 6 ? (
                    <button
                      type="button"
                      onClick={handleEditNextStep}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        theme === "dark"
                          ? "bg-[#238636] hover:bg-[#2ea043] text-white border border-[#238636]/50 shadow-sm"
                          : "bg-[#2da44e] hover:bg-[#2c974b] text-white border border-[#1a7f37] shadow-sm"
                      }`}
                    >
                      Suivant →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleUpdateSchool}
                      disabled={creating || !hasChanges}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        !hasChanges
                          ? theme === "dark"
                            ? "bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed"
                            : "bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed"
                          : theme === "dark"
                            ? "bg-[#238636] hover:bg-[#2ea043] text-white border border-[#238636]/50 shadow-sm"
                            : "bg-[#2da44e] hover:bg-[#2c974b] text-white border border-[#1a7f37] shadow-sm"
                      }`}
                      title={!hasChanges ? "Aucune modification détectée" : ""}
                    >
                      {creating ? "Mise à jour..." : hasChanges ? "Mettre à jour" : "Aucune modification"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Créer un Administrateur */}
      {adminModalMounted && (
        <Portal>
          <div 
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
              adminModalVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateAdminModal(false)} />
            
            <div 
              className={`relative w-full max-w-2xl rounded-xl ${cardBg} border ${borderColor} shadow-2xl transform transition-all duration-200 max-h-[90vh] flex flex-col ${
                adminModalVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              {/* Header */}
              <div className={`px-6 py-4 border-b ${borderColor} flex-shrink-0`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-semibold ${textColor}`}>Créer un Administrateur d'École</h2>
                    <p className={`text-xs ${textSecondary}`}>Un mot de passe temporaire sera généré automatiquement</p>
                  </div>
                </div>
              </div>

              {/* Content scrollable */}
              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-2.5 rounded-lg text-xs flex items-center gap-2 animate-shake">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={`block text-xs font-medium ${textColor} mb-1.5 flex items-center gap-1.5`}>
                      <Building2 className="w-3.5 h-3.5" />
                      École <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={adminForm.schoolId}
                      onChange={(e) => {
                        const selectedSchoolId = e.target.value
                        const selectedSchool = schools.find(s => s.id.toString() === selectedSchoolId)
                        
                        // Générer l'email automatiquement
                        let newEmail = adminForm.email
                        if (selectedSchool && adminForm.prenom) {
                          const schoolDomain = selectedSchool.nomEtablissement
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "") // Retirer les accents
                            .replace(/[^a-z0-9]/g, "") // Garder que lettres et chiffres
                            .slice(0, 20)
                          
                          const prenomNormalized = adminForm.prenom
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .replace(/[^a-z0-9]/g, "")
                          
                          newEmail = `${prenomNormalized}@${schoolDomain}.com`
                        }
                        
                        setAdminForm({ 
                          ...adminForm, 
                          schoolId: selectedSchoolId,
                          email: newEmail
                        })
                      }}
                      className={`h-9 text-sm w-full ${inputBg} border ${borderColor} rounded-lg px-3 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    >
                      <option value="">Sélectionner une école</option>
                      {schools.map(school => (
                        <option key={school.id} value={school.id}>{school.nomEtablissement}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium ${textColor} mb-1.5 flex items-center gap-1.5`}>
                      <User className="w-3.5 h-3.5" />
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={adminForm.prenom}
                      onChange={(e) => {
                        const newPrenom = e.target.value
                        
                        // Régénérer l'email si une école est sélectionnée
                        let newEmail = adminForm.email
                        if (adminForm.schoolId && newPrenom) {
                          const selectedSchool = schools.find(s => s.id.toString() === adminForm.schoolId)
                          if (selectedSchool) {
                            const schoolDomain = selectedSchool.nomEtablissement
                              .toLowerCase()
                              .normalize("NFD")
                              .replace(/[\u0300-\u036f]/g, "")
                              .replace(/[^a-z0-9]/g, "")
                              .slice(0, 20)
                            
                            const prenomNormalized = newPrenom
                              .toLowerCase()
                              .normalize("NFD")
                              .replace(/[\u0300-\u036f]/g, "")
                              .replace(/[^a-z0-9]/g, "")
                            
                            newEmail = `${prenomNormalized}@${schoolDomain}.com`
                          }
                        }
                        
                        setAdminForm({ 
                          ...adminForm, 
                          prenom: newPrenom,
                          email: newEmail
                        })
                      }}
                      className={`h-9 text-sm ${inputBg} border ${borderColor} ${textColor} placeholder:text-gray-500`}
                      placeholder="Jean"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium ${textColor} mb-1.5 flex items-center gap-1.5`}>
                      <User className="w-3.5 h-3.5" />
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={adminForm.nom}
                      onChange={(e) => setAdminForm({ ...adminForm, nom: e.target.value })}
                      className={`h-9 text-sm ${inputBg} border ${borderColor} ${textColor} placeholder:text-gray-500`}
                      placeholder="Dupont"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={`block text-xs font-medium ${textColor} mb-1.5 flex items-center gap-1.5`}>
                      <Mail className="w-3.5 h-3.5" />
                      Email <span className="text-red-500">*</span>
                      {adminForm.email && adminForm.schoolId && adminForm.prenom && (
                        <span className="ml-auto text-[10px] text-green-500 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Généré automatiquement
                        </span>
                      )}
                    </label>
                    <Input
                      type="email"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                      className={`h-9 text-sm ${inputBg} border ${borderColor} ${textColor} placeholder:text-gray-500`}
                      placeholder="prenom@ecole.com"
                    />
                    <p className={`text-[10px] ${textSecondary} mt-1 flex items-center gap-1`}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      L'email est généré à partir du prénom et de l'école (modifiable)
                    </p>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium ${textColor} mb-1.5 flex items-center gap-1.5`}>
                      <Phone className="w-3.5 h-3.5" />
                      Téléphone
                    </label>
                    <Input
                      type="text"
                      value={adminForm.telephone}
                      onChange={(e) => setAdminForm({ ...adminForm, telephone: e.target.value })}
                      className={`h-9 text-sm ${inputBg} border ${borderColor} ${textColor} placeholder:text-gray-500`}
                      placeholder="+243 XXX XXX XXX"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium ${textColor} mb-1.5 flex items-center gap-1.5`}>
                      <Briefcase className="w-3.5 h-3.5" />
                      Fonction
                    </label>
                    <select
                      value={adminForm.fonction}
                      onChange={(e) => setAdminForm({ ...adminForm, fonction: e.target.value })}
                      className={`h-9 text-sm w-full ${inputBg} border ${borderColor} rounded-lg px-3 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    >
                      <option value="Directeur">Directeur</option>
                      <option value="Directeur Adjoint">Directeur Adjoint</option>
                      <option value="Secrétaire Académique">Secrétaire Académique</option>
                      <option value="Administrateur">Administrateur</option>
                    </select>
                  </div>
                </div>

                <div className={`${theme === "dark" ? "bg-yellow-500/10" : "bg-yellow-50"} border ${theme === "dark" ? "border-yellow-500/30" : "border-yellow-200"} rounded-lg p-3`}>
                  <p className={`text-xs ${theme === "dark" ? "text-yellow-400" : "text-yellow-700"} flex items-start gap-2`}>
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Un mot de passe temporaire sera généré et devra être changé lors de la première connexion.</span>
                  </p>
                </div>
              </div>

              {/* Footer avec boutons */}
              <div className={`px-6 py-4 border-t ${borderColor} flex gap-3 flex-shrink-0`}>
                <button
                  onClick={() => setShowCreateAdminModal(false)}
                  disabled={creatingAdmin}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                    theme === "dark"
                      ? "bg-[#21262d] hover:bg-[#30363d] border-gray-700/50 hover:border-gray-600 text-gray-300 hover:text-gray-100"
                      : "bg-[#f6f8fa] hover:bg-[#f3f4f6] border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateAdmin}
                  disabled={creatingAdmin || !adminForm.schoolId || !adminForm.nom || !adminForm.prenom || !adminForm.email}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 ${
                    theme === "dark"
                      ? "bg-[#238636] hover:bg-[#2ea043] text-white border border-[#1a7f37]"
                      : "bg-[#2da44e] hover:bg-[#2c974b] text-white border border-[#1a7f37]"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {creatingAdmin ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Création...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Créer l'administrateur
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Success Modal with Confetti */}
      {showAdminSuccess && (
        <Portal>
          <div className="fixed inset-0 z-[60] flex items-center justify-center animate-in fade-in duration-200">
            {/* Confetti animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-fall"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-20px`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                >
                  {['🎉', '🎊', '✨', '🌟', '💫', '👨‍💼', '👩‍💼'][Math.floor(Math.random() * 7)]}
                </div>
              ))}
            </div>

            <div className="absolute inset-0 bg-black/50" />
            
            <div className={`relative ${cardBg} rounded-xl p-8 shadow-2xl max-w-md w-full mx-4 border ${borderColor} transform scale-100 animate-bounce-in`}>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <div className="text-5xl animate-scale-up">👨‍💼</div>
                </div>
                <h3 className={`text-2xl font-bold ${textColor} mb-2`}>
                  Administrateur créé avec succès !
                </h3>
                <p className={`text-sm ${textSecondary} mb-4`}>
                  L'administrateur <span className="font-semibold text-green-500">{adminForm.prenom} {adminForm.nom}</span> a été enregistré dans le système.
                </p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${theme === "dark" ? "bg-green-500/10" : "bg-green-50"} text-green-500 text-sm`}>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Affichage des identifiants...
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Identifiants Générés */}
      {showCredentialsModal && generatedCredentials && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
            <div className={`${cardBg} rounded-xl border ${borderColor} max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200`}>
              <div className={`p-6 border-b ${theme === "dark" ? "border-green-500/20 bg-green-500/5" : "border-green-200 bg-green-50"}`}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <KeyRound className="w-7 h-7 text-green-500" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${textColor}`}>Identifiants de Connexion</h2>
                    <p className={`text-xs ${textSecondary}`}>Informations d'accès générées automatiquement</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className={`${theme === "dark" ? "bg-yellow-500/10" : "bg-yellow-50"} border ${theme === "dark" ? "border-yellow-500/30" : "border-yellow-200"} rounded-lg p-4`}>
                  <p className={`${theme === "dark" ? "text-yellow-400" : "text-yellow-700"} text-sm font-medium flex items-start gap-2`}>
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>
                      <strong>Important :</strong> Copiez ces identifiants maintenant ! Ils ne seront plus affichés après la fermeture de cette fenêtre.
                    </span>
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className={`block text-xs font-semibold ${textColor} mb-2 flex items-center gap-1.5`}>
                      <Mail className="w-3.5 h-3.5" />
                      Email de connexion
                    </label>
                    <div className={`${inputBg} border-2 ${theme === "dark" ? "border-gray-700" : "border-gray-300"} rounded-lg p-3 flex items-center justify-between group hover:border-blue-500 transition-all`}>
                      <span className={`font-mono text-sm ${textColor} select-all`}>{generatedCredentials.email}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedCredentials.email)
                          // Toast notification visuelle
                        }}
                        className="text-blue-500 hover:text-blue-400 transition-colors p-1.5 hover:bg-blue-500/10 rounded"
                        title="Copier l'email"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold ${textColor} mb-2 flex items-center gap-1.5`}>
                      <Lock className="w-3.5 h-3.5" />
                      Mot de passe temporaire
                    </label>
                    <div className={`${inputBg} border-2 ${theme === "dark" ? "border-gray-700" : "border-gray-300"} rounded-lg p-3 flex items-center justify-between group hover:border-blue-500 transition-all`}>
                      <span className={`font-mono text-lg font-bold ${textColor} tracking-wider select-all`}>{generatedCredentials.password}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedCredentials.password)
                        }}
                        className="text-blue-500 hover:text-blue-400 transition-colors p-1.5 hover:bg-blue-500/10 rounded"
                        title="Copier le mot de passe"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <p className={`text-[10px] ${textSecondary} mt-1.5 flex items-center gap-1`}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      L'administrateur devra changer ce mot de passe lors de sa première connexion
                    </p>
                  </div>
                </div>

                <div className={`${theme === "dark" ? "bg-blue-500/10" : "bg-blue-50"} border ${theme === "dark" ? "border-blue-500/30" : "border-blue-200"} rounded-lg p-4 space-y-2`}>
                  <p className={`text-xs font-semibold ${theme === "dark" ? "text-blue-400" : "text-blue-700"} flex items-center gap-2`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Prochaines étapes
                  </p>
                  <ul className={`text-xs ${textSecondary} space-y-1 ml-6`}>
                    <li className="list-disc">Transmettez ces identifiants de manière sécurisée</li>
                    <li className="list-disc">L'administrateur se connectera sur la page de login standard</li>
                    <li className="list-disc">Il sera invité à créer un nouveau mot de passe</li>
                  </ul>
                </div>
              </div>

              <div className={`p-6 border-t ${borderColor} flex gap-3`}>
                <button
                  onClick={() => {
                    setShowCredentialsModal(false)
                    setGeneratedCredentials(null)
                  }}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 ${
                    theme === "dark"
                      ? "bg-[#238636] hover:bg-[#2ea043] text-white border border-[#1a7f37]"
                      : "bg-[#2da44e] hover:bg-[#2c974b] text-white border border-[#1a7f37]"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  J'ai copié les identifiants
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
      </div>
    </div>
  )
}
