"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Copy, Users, Wifi, WifiOff } from "lucide-react"

interface Player {
  id: string
  name: string
  connected: boolean
}

interface GameLobbyProps {
  gameId: string
  players: Player[]
  isConnected: boolean
  onStartGame: () => void
  onLeaveGame: () => void
}

export function GameLobby({ gameId, players, isConnected, onStartGame, onLeaveGame }: GameLobbyProps) {
  const [copied, setCopied] = useState(false)

  const copyGameId = async () => {
    try {
      await navigator.clipboard.writeText(gameId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy game ID:", err)
    }
  }

  const connectedPlayers = players.filter((p) => p.connected)
  const canStartGame = connectedPlayers.length === 2

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Connection Status */}
      <div className="text-center">
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
            isConnected
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          {isConnected ? "Connected" : "Disconnected"}
        </div>
      </div>

      {/* Game ID Card */}
      <Card className="p-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-primary">Game Room</h2>
          <div className="space-y-2">
            <p className="text-muted-foreground">Share this Game ID with your friend:</p>
            <div className="flex items-center gap-2 justify-center">
              <Input value={gameId} readOnly className="text-center text-2xl font-mono font-bold max-w-32" />
              <Button
                onClick={copyGameId}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-transparent"
              >
                <Copy className="w-4 h-4" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Players Card */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 justify-center">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Players ({connectedPlayers.length}/2)</h3>
          </div>

          <div className="space-y-3">
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  player.connected
                    ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                    : "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${player.connected ? "bg-green-500" : "bg-gray-400"}`} />
                  <span className="font-medium">{player.name}</span>
                </div>
                <span
                  className={`text-sm ${player.connected ? "text-green-600 dark:text-green-400" : "text-gray-500"}`}
                >
                  {player.connected ? "Connected" : "Disconnected"}
                </span>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: 2 - players.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="flex items-center justify-between p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span className="text-gray-500">Waiting for player...</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button onClick={onStartGame} disabled={!canStartGame || !isConnected} size="lg" className="px-8">
          {canStartGame ? "Start Game" : `Waiting for ${2 - connectedPlayers.length} more player(s)`}
        </Button>

        <Button onClick={onLeaveGame} variant="outline" size="lg">
          Leave Game
        </Button>
      </div>

      {/* Instructions */}
      <Card className="p-4 bg-muted">
        <div className="text-center space-y-2">
          <h4 className="font-semibold text-sm">How to Play:</h4>
          <p className="text-sm text-muted-foreground">
            Share the Game ID with a friend. Once both players are connected, you can start the game. Take turns
            spinning the bottle on your own devices!
          </p>
        </div>
      </Card>
    </div>
  )
}
