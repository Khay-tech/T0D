"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Plus, LogIn, Loader2 } from "lucide-react"

interface GameSetupProps {
  onCreateGame: (playerName: string) => Promise<void>
  onJoinGame: (gameId: string, playerName: string) => Promise<void>
  isLoading: boolean
  error: string | null
}

export function GameSetup({ onCreateGame, onJoinGame, isLoading, error }: GameSetupProps) {
  const [playerName, setPlayerName] = useState("")
  const [gameIdToJoin, setGameIdToJoin] = useState("")
  const [mode, setMode] = useState<"create" | "join" | null>(null)

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerName.trim()) return
    await onCreateGame(playerName.trim())
  }

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerName.trim() || !gameIdToJoin.trim()) return
    await onJoinGame(gameIdToJoin.trim().toUpperCase(), playerName.trim())
  }

  if (mode === null) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">Spin the Bottle</h1>
          <p className="text-muted-foreground">Truth or Dare Game for Two Players</p>
        </div>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-center">Choose an Option</h2>

          <div className="space-y-3">
            <Button onClick={() => setMode("create")} className="w-full h-12 text-lg" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create New Game
            </Button>

            <Button onClick={() => setMode("join")} variant="outline" className="w-full h-12 text-lg" size="lg">
              <LogIn className="w-5 h-5 mr-2" />
              Join Existing Game
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">Spin the Bottle</h1>
        <p className="text-muted-foreground">
          {mode === "create" ? "Create a new game room" : "Join an existing game"}
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={mode === "create" ? handleCreateGame : handleJoinGame} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playerName">Your Name</Label>
            <Input
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              required
              disabled={isLoading}
            />
          </div>

          {mode === "join" && (
            <div className="space-y-2">
              <Label htmlFor="gameId">Game ID</Label>
              <Input
                id="gameId"
                value={gameIdToJoin}
                onChange={(e) => setGameIdToJoin(e.target.value.toUpperCase())}
                placeholder="Enter 6-character Game ID"
                maxLength={6}
                required
                disabled={isLoading}
                className="font-mono text-center"
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !playerName.trim() || (mode === "join" && !gameIdToJoin.trim())}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === "create" ? "Creating..." : "Joining..."}
                </>
              ) : (
                <>
                  {mode === "create" ? (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Game Room
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Join Game Room
                    </>
                  )}
                </>
              )}
            </Button>

            <Separator />

            <Button type="button" variant="ghost" onClick={() => setMode(null)} disabled={isLoading} className="w-full">
              Back to Options
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-4 bg-muted">
        <div className="text-center space-y-2">
          <h4 className="font-semibold text-sm">{mode === "create" ? "Creating a Game:" : "Joining a Game:"}</h4>
          <p className="text-sm text-muted-foreground">
            {mode === "create"
              ? "You'll get a 6-character Game ID to share with your friend."
              : "Ask your friend for their 6-character Game ID to join their room."}
          </p>
        </div>
      </Card>
    </div>
  )
}
