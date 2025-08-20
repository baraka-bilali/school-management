import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { 
    
  BarChart3, 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardCheck, 
  Settings, 
  LogOut,
  Bell,
  Menu,
  School,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "School Management",
  description: "Système de gestion scolaire",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`bg-gray-50 ${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Top Navigation */}
        <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <button id="sidebarToggle" className="text-gray-500 hover:text-gray-600 mr-4">
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-800">School Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="text-gray-500 hover:text-gray-600">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
                </button>
              </div>
              <div className="relative">
                <button className="flex items-center space-x-2">
                  <img src="https://randomuser.me/api/portraits/men/1.jpg" alt="User" className="w-8 h-8 rounded-full" />
                  <span className="hidden md:inline-block text-gray-700">Admin</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Sidebar */}
        <aside id="sidebar" className="fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 pt-16 transition-all duration-300 z-30">
          <div className="px-4 py-4 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <School className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="logo-text text-lg font-semibold text-gray-800">École ABC</span>
          </div>
          <nav className="mt-6">
            <div className="px-4">
              <h3 className="text-xs uppercase font-semibold text-gray-500 mb-4">Menu principal</h3>
            </div>
            <ul>
              <li className="mb-1">
                <a href="#" className="nav-item flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg active-nav">
                  <BarChart3 className="w-4 h-4 mr-3" />
                  <span className="nav-text">Tableau de bord</span>
                </a>
              </li>
              <li className="mb-1">
                <a href="#users" className="nav-item flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Users className="w-4 h-4 mr-3" />
                  <span className="nav-text">Utilisateurs</span>
                </a>
              </li>
              <li className="mb-1">
                <a href="#classes" className="nav-item flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <GraduationCap className="w-4 h-4 mr-3" />
                  <span className="nav-text">Classes & Filières</span>
                </a>
              </li>
              <li className="mb-1">
                <a href="#subjects" className="nav-item flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <BookOpen className="w-4 h-4 mr-3" />
                  <span className="nav-text">Matières</span>
                </a>
              </li>
              <li className="mb-1">
                <a href="#attendance" className="nav-item flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <ClipboardCheck className="w-4 h-4 mr-3" />
                  <span className="nav-text">Présences</span>
                </a>
              </li>
              <li className="mb-1">
                <a href="#grades" className="nav-item flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <GraduationCap className="w-4 h-4 mr-3" />
                  <span className="nav-text">Notes & Bulletins</span>
                </a>
              </li>
            </ul>
            <div className="px-4 mt-8">
              <h3 className="text-xs uppercase font-semibold text-gray-500 mb-4">Administration</h3>
            </div>
            <ul>
              <li className="mb-1">
                <a href="#" className="nav-item flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Settings className="w-4 h-4 mr-3" />
                  <span className="nav-text">Paramètres</span>
                </a>
              </li>
              <li className="mb-1">
                <a href="#" className="nav-item flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <LogOut className="w-4 h-4 mr-3" />
                  <span className="nav-text">Déconnexion</span>
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main id="mainContent" className="pt-16 ml-64 transition-all duration-300">
          <div className="p-6">
            {/* Dashboard Content */}
            <div id="dashboard">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Tableau de bord</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500">Élèves</p>
                      <h3 className="text-2xl font-bold text-gray-800">1,248</h3>
                      <p className="text-green-500 text-sm mt-1 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" /> 12% vs mois dernier
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500">Enseignants</p>
                      <h3 className="text-2xl font-bold text-gray-800">48</h3>
                      <p className="text-green-500 text-sm mt-1 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" /> 5% vs mois dernier
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500">Classes</p>
                      <h3 className="text-2xl font-bold text-gray-800">24</h3>
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <TrendingDown className="w-3 h-3 mr-1" /> 2% vs mois dernier
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <School className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500">Taux de présence</p>
                      <h3 className="text-2xl font-bold text-gray-800">94%</h3>
                      <p className="text-green-500 text-sm mt-1 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" /> 3% vs mois dernier
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <ClipboardCheck className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">Présence par classe</h3>
                    <select className="border border-gray-300 rounded-md px-3 py-1 text-sm">
                      <option>Ce mois</option>
                      <option>Le mois dernier</option>
                      <option>Cette année</option>
                    </select>
                  </div>
                  <div className="chart-container">
                    <canvas id="attendanceChart" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">Répartition des élèves</h3>
                    <select className="border border-gray-300 rounded-md px-3 py-1 text-sm">
                      <option>Toutes filières</option>
                      <option>Scientifique</option>
                      <option>Littéraire</option>
                      <option>Technique</option>
                    </select>
                  </div>
                  <div className="chart-container">
                    <canvas id="studentsChart" />
                  </div>
                </div>
              </div>
              
              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">Activité récente</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  <div className="px-6 py-4 flex items-start">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                      <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Nouvel élève inscrit</p>
                      <p className="text-sm text-gray-500">Jean Dupont a été ajouté à la classe Terminale A</p>
                      <p className="text-xs text-gray-400 mt-1">Il y a 2 heures</p>
                    </div>
                  </div>
                  <div className="px-6 py-4 flex items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Nouvelle matière ajoutée</p>
                      <p className="text-sm text-gray-500">Philosophie a été ajoutée au programme de Terminale</p>
                      <p className="text-xs text-gray-400 mt-1">Il y a 5 heures</p>
                    </div>
                  </div>
                  <div className="px-6 py-4 flex items-start">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                      <ClipboardCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Présences mises à jour</p>
                      <p className="text-sm text-gray-500">M. Martin a mis à jour les présences pour la classe 1ère B</p>
                      <p className="text-xs text-gray-400 mt-1">Il y a 1 jour</p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-3 bg-gray-50 text-center">
                  <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Voir toute l'activité</a>
                </div>
              </div>
            </div>
            
            {/* Users Content */}
            <div id="users" className="hidden">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Gestion des utilisateurs</h2>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center">
                  <Plus className="w-4 h-4 mr-2" /> Ajouter un utilisateur
                </button>
              </div>
              {children}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <Search className="w-4 h-4 text-gray-400 mr-2" />
                    <input type="text" placeholder="Rechercher..." className="border border-gray-300 rounded-md px-3 py-1 text-sm w-64" />
                  </div>
                  <div className="flex items-center space-x-4">
                    <button className="text-gray-500 hover:text-gray-700">
                      <Filter className="w-4 h-4" />
                    </button>
                    <button className="text-gray-500 hover:text-gray-700">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-full" src="https://randomuser.me/api/portraits/men/1.jpg" alt="" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">Pierre Martin</div>
                              <div className="text-sm text-gray-500">pierre.martin@example.com</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">pierre.martin@example.com</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Administrateur</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Actif</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3 flex items-center">
                            <Edit className="w-3 h-3 mr-1" /> Modifier
                          </button>
                          <button className="text-red-600 hover:text-red-900 flex items-center">
                            <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-full" src="https://randomuser.me/api/portraits/women/1.jpg" alt="" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">Sophie Dubois</div>
                              <div className="text-sm text-gray-500">sophie.dubois@example.com</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">sophie.dubois@example.com</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Enseignant</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Actif</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3 flex items-center">
                            <Edit className="w-3 h-3 mr-1" /> Modifier
                          </button>
                          <button className="text-red-600 hover:text-red-900 flex items-center">
                            <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-full" src="https://randomuser.me/api/portraits/men/2.jpg" alt="" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">Jean Dupont</div>
                              <div className="text-sm text-gray-500">jean.dupont@example.com</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">jean.dupont@example.com</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Élève</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Actif</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3 flex items-center">
                            <Edit className="w-3 h-3 mr-1" /> Modifier
                          </button>
                          <button className="text-red-600 hover:text-red-900 flex items-center">
                            <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Affichage <span className="font-medium">1</span> à <span className="font-medium">3</span> sur <span className="font-medium">24</span> résultats
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center">
                      <ChevronLeft className="w-3 h-3 mr-1" /> Précédent
                    </button>
                    <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center">
                      Suivant <ChevronRight className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Classes Content */}
            <div id="classes" className="hidden">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Gestion des classes et filières</h2>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center">
                  <Plus className="w-4 h-4 mr-2" /> Ajouter une classe
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800">Terminale Scientifique</h3>
                  </div>
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-600">Effectif</span>
                      <span className="font-medium">32 élèves</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-600">Professeur principal</span>
                      <span className="font-medium">M. Martin</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Année scolaire</span>
                      <span className="font-medium">2023-2024</span>
                    </div>
                  </div>
                  <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium flex items-center">
                      <Edit className="w-3 h-3 mr-1" /> Modifier
                    </button>
                    <button className="text-red-600 hover:text-red-900 text-sm font-medium flex items-center">
                      <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                    </button>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800">Première Littéraire</h3>
                  </div>
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-600">Effectif</span>
                      <span className="font-medium">28 élèves</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-600">Professeur principal</span>
                      <span className="font-medium">Mme. Dubois</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Année scolaire</span>
                      <span className="font-medium">2023-2024</span>
                    </div>
                  </div>
                  <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium flex items-center">
                      <Edit className="w-3 h-3 mr-1" /> Modifier
                    </button>
                    <button className="text-red-600 hover:text-red-900 text-sm font-medium flex items-center">
                      <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                    </button>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800">Seconde Générale</h3>
                  </div>
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-600">Effectif</span>
                      <span className="font-medium">35 élèves</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-600">Professeur principal</span>
                      <span className="font-medium">M. Durand</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Année scolaire</span>
                      <span className="font-medium">2023-2024</span>
                    </div>
                  </div>
                  <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium flex items-center">
                      <Edit className="w-3 h-3 mr-1" /> Modifier
                    </button>
                    <button className="text-red-600 hover:text-red-900 text-sm font-medium flex items-center">
                      <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Filières</h3>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-800">Liste des filières</h4>
                      <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center">
                        <Plus className="w-3 h-3 mr-1" /> Ajouter une filière
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    <div className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-800">Scientifique</h5>
                        <p className="text-sm text-gray-500">12 classes, 384 élèves</p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-indigo-600 hover:text-indigo-900 flex items-center">
                          <Edit className="w-3 h-3 mr-1" /> Modifier
                        </button>
                        <button className="text-red-600 hover:text-red-900 flex items-center">
                          <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                        </button>
                      </div>
                    </div>
                    <div className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-800">Littéraire</h5>
                        <p className="text-sm text-gray-500">8 classes, 224 élèves</p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-indigo-600 hover:text-indigo-900 flex items-center">
                          <Edit className="w-3 h-3 mr-1" /> Modifier
                        </button>
                        <button className="text-red-600 hover:text-red-900 flex items-center">
                          <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                        </button>
                      </div>
                    </div>
                    <div className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-800">Technique</h5>
                        <p className="text-sm text-gray-500">4 classes, 120 élèves</p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-indigo-600 hover:text-indigo-900 flex items-center">
                          <Edit className="w-3 h-3 mr-1" /> Modifier
                        </button>
                        <button className="text-red-600 hover:text-red-900 flex items-center">
                          <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
