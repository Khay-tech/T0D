import { type NextRequest, NextResponse } from "next/server"
import { updatePlayerHeartbeat } from "@/lib/game-store"

export async function POST(request: NextRequest, { params }: { params: { gameId: string } }) {
  const body = await request.json()
  const { playerId } = body

  if (!playerId) {
    return NextResponse.json({ error: "Player ID required" }, { status: 400 })
  }

  const success = updatePlayerHeartbeat(params.gameId, playerId)

  if (!success) {
    return NextResponse.json({ error: "Failed to update heartbeat" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
