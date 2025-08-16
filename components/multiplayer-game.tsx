"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useGameConnection } from "@/hooks/use-game-connection"
import { Wifi, WifiOff, Users, RefreshCw } from "lucide-react"

interface MultiplayerGameProps {
  gameId: string
  playerId: string
  playerName: string
  onLeaveGame: () => void
}

export function MultiplayerGame({ gameId, playerId, playerName, onLeaveGame }: MultiplayerGameProps) {
  const { gameState, isConnected, error, isReconnecting, reconnectAttempts, spinBottle, resetGame } = useGameConnection(
    gameId,
    playerId,
    playerName,
  )
  const bottleRef = useRef<HTMLDivElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // Handle bottle animation when spinning state changes
  useEffect(() => {
    if (!gameState || !bottleRef.current) return

    if (gameState.isSpinning && !isAnimating) {
      // Start animation
      setIsAnimating(true)
      bottleRef.current.classList.add("spin-animation")

      // Remove animation after 3 seconds
      setTimeout(() => {
        if (bottleRef.current) {
          bottleRef.current.classList.remove("spin-animation")
        }
        setIsAnimating(false)
      }, 3000)
    }
  }, [gameState, isAnimating])

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 flex items-center justify-center">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">{isReconnecting ? "Reconnecting..." : "Loading Game..."}</h2>
          {isReconnecting && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Attempt {reconnectAttempts}/5</span>
            </div>
          )}
          {error && <p className="text-red-500">{error}</p>}
        </Card>
      </div>
    )
  }

  const currentPlayerData = gameState.players[gameState.currentPlayer]
  const isMyTurn = currentPlayerData?.id === playerId
  const connectedPlayers = gameState.players.filter((p) => p.connected)

  const getPlayerStats = (playerName: string) => {
    const playerResults = gameState.gameHistory.filter((result) => result.player === playerName)
    const truthCount = playerResults.filter((result) => result.choice === "truth").length
    const dareCount = playerResults.filter((result) => result.choice === "dare").length
    return { truthCount, dareCount, total: playerResults.length }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Connection Status */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-primary">Spin the Bottle</h1>
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
                isConnected
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : isReconnecting
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {isConnected ? (
                <Wifi className="w-4 h-4" />
              ) : isReconnecting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              {isConnected ? "Connected" : isReconnecting ? "Reconnecting..." : "Disconnected"}
            </div>
          </div>
          <p className="text-muted-foreground">Game ID: {gameId}</p>
        </div>

        {/* Players Status */}
        <div className="text-center mb-6">
          <Card className="inline-block p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-medium">Players Online: {connectedPlayers.length}/2</span>
              </div>
              <div className="flex gap-2">
                {gameState.players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`px-2 py-1 rounded text-sm ${
                      player.connected
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {player.name}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {connectedPlayers.length < 2 && (
          <div className="text-center mb-6">
            <Card className="p-4 bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
              <p className="text-yellow-800 dark:text-yellow-200">Waiting for other player to reconnect...</p>
            </Card>
          </div>
        )}

        {/* Current Player Indicator */}
        <div className="text-center mb-6">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${
              isMyTurn ? "bg-accent text-accent-foreground border-accent" : "bg-card text-card-foreground border-border"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full ${isMyTurn ? "bg-accent-foreground animate-pulse" : "bg-muted"}`}
            ></div>
            <span className="font-semibold">
              {isMyTurn ? "Your Turn!" : `${currentPlayerData?.name || "Unknown"}'s Turn`}
            </span>
          </div>
        </div>

        {/* Game Area */}
        <div className="relative mb-8">
          {/* Truth and Dare Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Truth Section */}
            <Card
              className={`p-6 text-center transition-all duration-300 ${
                gameState.currentResult === "truth" ? "ring-4 ring-blue-400 bg-blue-50 dark:bg-blue-950" : ""
              }`}
            >
              <div className="text-6xl mb-4">🤔</div>
              <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">TRUTH</h2>
              <p className="text-sm text-muted-foreground">Answer honestly!</p>
            </Card>

            {/* Dare Section */}
            <Card
              className={`p-6 text-center transition-all duration-300 ${
                gameState.currentResult === "dare" ? "ring-4 ring-red-400 bg-red-50 dark:bg-red-950" : ""
              }`}
            >
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">DARE</h2>
              <p className="text-sm text-muted-foreground">Take the challenge!</p>
            </Card>
          </div>

          {/* Bottle Container */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Bottle */}
              <div
                ref={bottleRef}
                className={`w-32 h-32 relative cursor-pointer transition-all duration-300 ${
                  gameState.isSpinning ? "glow-animation" : ""
                }`}
                style={{ transformOrigin: "center center" }}
              >
                {/* Bottle SVG */}
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full drop-shadow-lg"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Bottle Body */}
                  <ellipse cx="50" cy="65" rx="15" ry="25" fill="#8B4513" stroke="#654321" strokeWidth="2" />
                  {/* Bottle Neck */}
                  <rect x="45" y="35" width="10" height="15" fill="#8B4513" stroke="#654321" strokeWidth="2" />
                  {/* Bottle Cap */}
                  <rect x="43" y="30" width="14" height="8" rx="2" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
                  {/* Bottle Tip (pointing direction) */}
                  <circle cx="50" cy="25" r="3" fill="#FF0000" />
                  {/* Label */}
                  <rect x="40" y="55" width="20" height="12" rx="2" fill="#FFFFFF" opacity="0.8" />
                  <text x="50" y="63" textAnchor="middle" fontSize="6" fill="#333">
                    SPIN
                  </text>
                </svg>
              </div>

              {/* Center Point */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-lg"></div>
            </div>
          </div>

          {/* Result Display */}
          {gameState.currentResult && (
            <div className="text-center mb-6">
              <div
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-lg ${
                  gameState.currentResult === "truth"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                <span className="text-2xl">{gameState.currentResult === "truth" ? "🤔" : "🎯"}</span>
                It's a {gameState.currentResult.toUpperCase()}!
              </div>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            onClick={spinBottle}
            disabled={gameState.isSpinning || !isMyTurn || !isConnected || connectedPlayers.length < 2}
            size="lg"
            className="px-8 py-3 text-lg font-semibold"
          >
            {gameState.isSpinning
              ? "Spinning..."
              : !isMyTurn
                ? "Wait for your turn"
                : connectedPlayers.length < 2
                  ? "Waiting for players"
                  : "SPIN THE BOTTLE"}
          </Button>

          <Button onClick={resetGame} variant="outline" size="lg" className="px-6 py-3 bg-transparent">
            Reset Game
          </Button>

          <Button onClick={onLeaveGame} variant="destructive" size="lg" className="px-6 py-3">
            Leave Game
          </Button>
        </div>

        {/* Player Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {gameState.players.map((player) => {
            const stats = getPlayerStats(player.name)
            return (
              <Card key={player.id} className={`p-4 ${player.id === playerId ? "ring-2 ring-primary" : ""}`}>
                <h3 className="font-bold text-lg mb-3 text-center flex items-center justify-center gap-2">
                  {player.name}
                  {player.id === playerId && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">You</span>
                  )}
                  <div className={`w-2 h-2 rounded-full ${player.connected ? "bg-green-500" : "bg-gray-400"}`} />
                </h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.truthCount}</div>
                    <div className="text-xs text-muted-foreground">Truths</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.dareCount}</div>
                    <div className="text-xs text-muted-foreground">Dares</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{stats.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Game History */}
        {gameState.gameHistory.length > 0 && (
          <Card className="p-4">
            <h3 className="font-bold text-lg mb-3">Game History</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {gameState.gameHistory
                .slice()
                .reverse()
                .map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                    <span className="font-medium">{result.player}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        result.choice === "truth"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {result.choice.toUpperCase()}
                    </span>
                    <span className="text-muted-foreground">{new Date(result.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="p-4 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800 mt-4">
            <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
          </Card>
        )}
      </div>
    </div>
  )
}
