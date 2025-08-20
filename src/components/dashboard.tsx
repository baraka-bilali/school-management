import { 
  Users, 
  School, 
  ClipboardCheck, 
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
} from "lucide-react"

export default function Dashboard() {
  return (
    <div>
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
                <School className="w-5 h-5 text-blue-600" />
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
    </div>
  )
}
