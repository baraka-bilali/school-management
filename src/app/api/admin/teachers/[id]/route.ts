import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: "ID invalide" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const data = await request.json()

    // Validate required fields
    const requiredFields = ["lastName", "firstName"]
    for (const field of requiredFields) {
      if (!data[field]?.trim()) {
        return new Response(
          JSON.stringify({ error: `Le champ ${field} est requis` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
      }
    }

    // Update teacher
    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        lastName: data.lastName,
        middleName: data.middleName,
        firstName: data.firstName,
        gender: data.gender,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        specialty: data.specialty,
        phone: data.phone,
      },
    })

    return new Response(JSON.stringify({ teacher }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error: any) {
    console.error("Error updating teacher:", error)
    
    // Handle Prisma specific errors
    if (error.code === "P2025") {
      return new Response(
        JSON.stringify({ error: "Enseignant non trouvé" }), 
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ 
        error: error.message || "Erreur lors de la modification de l'enseignant" 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}