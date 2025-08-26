import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ 
    message: "API de test fonctionne !",
    timestamp: new Date().toISOString()
  })
}
