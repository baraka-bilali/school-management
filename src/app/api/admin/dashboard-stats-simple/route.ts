import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST] Dashboard stats API called')
    
    // Retour simple pour tester
    return NextResponse.json({
      students: 10,
      teachers: 5,
      classes: 3,
      attendance: "95%",
      monthLabels: ["Jan", "Fev", "Mar"],
      monthlyStudents: [5, 8, 10],
      monthlyTeachers: [3, 4, 5],
      monthlyPayments: [1000, 1500, 2000],
      genderStats: { male: 6, female: 4 },
      sectionStats: { Primaire: 6, Secondaire: 4 },
    })
  } catch (error) {
    console.error('[ERROR] Dashboard stats:', error)
    return NextResponse.json({ 
      error: "Erreur serveur", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
