import { NextResponse } from "next/server"
import { createGame } from "@/lib/game-store"

export async function POST() {
  const gameId = createGame()
  return NextResponse.json({ gameId })
}
