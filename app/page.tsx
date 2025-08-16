"use client"

import { useState } from "react"
import { GameSetup } from "@/components/game-setup"
import { GameLobby } from "@/components/game-lobby"
import { MultiplayerGame } from "@/components/multiplayer-game"
import { useGameConnection } from "@/hooks/use-game-connection"

type AppState = "setup" | "lobby" | "game"

export default function SpinTheBottleApp() {
  const [appState, setAppState] = useState<AppState>("setup")
  const [gameId, setGameId] = useState<string | null>(null)
  const [playerId] = useState(() => Math.random().toString(36).substring(2, 15))
  const [playerName, setPlayerName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { gameState, isConnected } = useGameConnection(gameId, playerId, playerName)

  const handleCreateGame = async (name: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Create game room
      const createResponse = await fetch("/api/game/create", {
        method: "POST",
      })

      if (!createResponse.ok) {
        throw new Error("Failed to create game")
      }

      const { gameId: newGameId } = await createResponse.json()

      // Set game details and move to lobby
      setGameId(newGameId)
      setPlayerName(name)
      setAppState("lobby")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create game")
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinGame = async (gameIdToJoin: string, name: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Check if game exists
      const checkResponse = await fetch(`/api/game/${gameIdToJoin}`)

      if (!checkResponse.ok) {
        throw new Error("Game not found")
      }

      // Set game details and move to lobby
      setGameId(gameIdToJoin)
      setPlayerName(name)
      setAppState("lobby")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join game")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartGame = () => {
    if (gameState && gameState.players.filter((p) => p.connected).length === 2) {
      setAppState("game")
    }
  }

  const handleLeaveGame = () => {
    setGameId(null)
    setPlayerName("")
    setAppState("setup")
    setError(null)
  }

  if (appState === "setup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 flex items-center justify-center">
        <GameSetup onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} isLoading={isLoading} error={error} />
      </div>
    )
  }

  if (appState === "lobby" && gameId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 flex items-center justify-center">
        <GameLobby
          gameId={gameId}
          players={gameState?.players || []}
          isConnected={isConnected}
          onStartGame={handleStartGame}
          onLeaveGame={handleLeaveGame}
        />
      </div>
    )
  }

  if (appState === "game" && gameId) {
    return <MultiplayerGame gameId={gameId} playerId={playerId} playerName={playerName} onLeaveGame={handleLeaveGame} />
  }

  // Fallback loading state
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">Spin the Bottle</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
