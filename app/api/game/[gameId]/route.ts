import { type NextRequest, NextResponse } from "next/server"
import { getGame, updateGame, joinGame, leaveGame } from "@/lib/game-store"

export async function GET(request: NextRequest, { params }: { params: { gameId: string } }) {
  const game = getGame(params.gameId)

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 })
  }

  return NextResponse.json(game)
}

export async function POST(request: NextRequest, { params }: { params: { gameId: string } }) {
  const body = await request.json()
  const { action, playerId, playerName, result } = body

  switch (action) {
    case "join":
      const joinedGame = joinGame(params.gameId, playerId, playerName)
      if (!joinedGame) {
        return NextResponse.json({ error: "Cannot join game" }, { status: 400 })
      }
      return NextResponse.json(joinedGame)

    case "leave":
      const leftGame = leaveGame(params.gameId, playerId)
      if (!leftGame) {
        return NextResponse.json({ error: "Game not found" }, { status: 404 })
      }
      return NextResponse.json(leftGame)

    case "spin":
      const game = getGame(params.gameId)
      if (!game || game.isSpinning) {
        return NextResponse.json({ error: "Cannot spin right now" }, { status: 400 })
      }

      // Start spinning
      const spinningGame = updateGame(params.gameId, { isSpinning: true, currentResult: null })

      // Simulate spin result after 3 seconds
      setTimeout(() => {
        const finalResult = Math.random() < 0.5 ? "truth" : "dare"
        const currentPlayerName = game.players[game.currentPlayer]?.name || `Player ${game.currentPlayer + 1}`

        const newHistory = [
          ...game.gameHistory,
          {
            player: currentPlayerName,
            choice: finalResult,
            timestamp: new Date(),
          },
        ]

        updateGame(params.gameId, {
          isSpinning: false,
          currentResult: finalResult,
          gameHistory: newHistory,
          currentPlayer: (game.currentPlayer + 1) % 2,
        })
      }, 3000)

      return NextResponse.json(spinningGame)

    case "reset":
      const resetGame = updateGame(params.gameId, {
        currentPlayer: 0,
        isSpinning: false,
        currentResult: null,
        gameHistory: [],
      })
      return NextResponse.json(resetGame)

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }
}
