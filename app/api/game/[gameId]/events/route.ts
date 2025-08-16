import type { NextRequest } from "next/server"
import { getGame } from "@/lib/game-store"

export async function GET(request: NextRequest, { params }: { params: { gameId: string } }) {
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Allow-Headers": "Cache-Control",
  }

  // Check if game exists before starting stream
  const initialGame = getGame(params.gameId)
  if (!initialGame) {
    return new Response("Game not found", { status: 404 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const sendGameState = (game: any) => {
        const data = `data: ${JSON.stringify(game)}\n\n`
        controller.enqueue(encoder.encode(data))
      }

      // Send initial game state
      sendGameState(initialGame)

      // Set up polling for game state changes
      const interval = setInterval(() => {
        try {
          const currentGame = getGame(params.gameId)
          if (currentGame) {
            sendGameState(currentGame)
          } else {
            controller.enqueue(encoder.encode("event: close\ndata: Game ended\n\n"))
            controller.close()
            clearInterval(interval)
          }
        } catch (error) {
          console.error("SSE polling error:", error)
          controller.enqueue(encoder.encode("event: error\ndata: Server error\n\n"))
          controller.close()
          clearInterval(interval)
        }
      }, 1000)

      // Cleanup on close
      const cleanup = () => {
        clearInterval(interval)
        try {
          controller.close()
        } catch (e) {
          // Controller already closed
        }
      }

      request.signal.addEventListener("abort", cleanup)

      setTimeout(cleanup, 30 * 60 * 1000) // 30 minutes max connection
    },
  })

  return new Response(stream, { headers })
}
