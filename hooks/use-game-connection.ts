"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface GameState {
  gameId: string
  players: {
    id: string
    name: string
    connected: boolean
    lastSeen: Date
  }[]
  currentPlayer: number
  isSpinning: boolean
  currentResult: "truth" | "dare" | null
  gameHistory: {
    player: string
    choice: "truth" | "dare"
    timestamp: Date
  }[]
  createdAt: Date
  lastActivity: Date
}

export function useGameConnection(gameId: string | null, playerId: string, playerName: string) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const joinGame = useCallback(async () => {
    if (!gameId) return

    try {
      setIsReconnecting(true)
      const response = await fetch(`/api/game/${gameId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          playerId,
          playerName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to join game")
      }

      const game = await response.json()
      setGameState(game)
      setIsConnected(true)
      setError(null)
      setReconnectAttempts(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join game")
      setIsConnected(false)
    } finally {
      setIsReconnecting(false)
    }
  }, [gameId, playerId, playerName])

  const sendHeartbeat = useCallback(async () => {
    if (!gameId || !isConnected) return

    try {
      const response = await fetch(`/api/game/${gameId}/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      })

      if (!response.ok) {
        throw new Error("Heartbeat failed")
      }
    } catch (err) {
      console.error("Heartbeat failed:", err)
    }
  }, [gameId, playerId, isConnected])

  const attemptReconnection = useCallback(async () => {
    if (!gameId || isReconnecting || reconnectAttempts >= 5) return

    setIsReconnecting(true)
    setReconnectAttempts((prev) => prev + 1)

    try {
      await joinGame()
    } catch (err) {
      console.error("Reconnection failed:", err)

      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
      reconnectTimeout.current = setTimeout(() => {
        attemptReconnection()
      }, delay)
    }
  }, [gameId, isReconnecting, reconnectAttempts, joinGame])

  const leaveGame = useCallback(async () => {
    if (!gameId) return

    try {
      await fetch(`/api/game/${gameId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "leave",
          playerId,
        }),
      })
      setIsConnected(false)
    } catch (err) {
      console.error("Failed to leave game:", err)
    }
  }, [gameId, playerId])

  const spinBottle = useCallback(async () => {
    if (!gameId || !gameState || gameState.isSpinning) return

    try {
      const response = await fetch(`/api/game/${gameId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "spin",
          playerId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to spin bottle")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to spin bottle")
    }
  }, [gameId, gameState, playerId])

  const resetGame = useCallback(async () => {
    if (!gameId) return

    try {
      const response = await fetch(`/api/game/${gameId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset",
          playerId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to reset game")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset game")
    }
  }, [gameId, playerId])

  const connectToEventStream = useCallback(() => {
    if (!gameId || !isConnected || eventSourceRef.current) return

    console.log("[v0] Connecting to EventSource for game:", gameId)

    const eventSource = new EventSource(`/api/game/${gameId}/events`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log("[v0] EventSource connected successfully")
      setError(null)
    }

    eventSource.onmessage = (event) => {
      try {
        console.log("[v0] Received game state update")
        const game = JSON.parse(event.data)
        game.gameHistory = game.gameHistory.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }))
        game.createdAt = new Date(game.createdAt)
        game.lastActivity = new Date(game.lastActivity)
        game.players = game.players.map((player: any) => ({
          ...player,
          lastSeen: new Date(player.lastSeen),
        }))

        setGameState(game)
        setError(null)
      } catch (err) {
        console.error("[v0] Failed to parse game state:", err)
        setError("Failed to sync game state")
      }
    }

    eventSource.onerror = (event) => {
      console.error("[v0] EventSource error:", event)

      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }

      setError("Connection lost")
      setIsConnected(false)

      if (!isReconnecting && reconnectAttempts < 5) {
        console.log("[v0] Attempting reconnection...")
        attemptReconnection()
      }
    }
  }, [gameId, isConnected, isReconnecting, reconnectAttempts, attemptReconnection])

  const disconnectEventStream = useCallback(() => {
    if (eventSourceRef.current) {
      console.log("[v0] Closing EventSource connection")
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  useEffect(() => {
    if (gameId && !isConnected && !gameState && !isReconnecting) {
      joinGame()
    }
  }, [gameId, isConnected, gameState, isReconnecting, joinGame])

  useEffect(() => {
    if (isConnected && gameId && gameState) {
      connectToEventStream()
    } else {
      disconnectEventStream()
    }

    return disconnectEventStream
  }, [isConnected, gameId, gameState, connectToEventStream, disconnectEventStream])

  useEffect(() => {
    if (isConnected && gameId) {
      sendHeartbeat()
      heartbeatInterval.current = setInterval(sendHeartbeat, 10 * 1000)
    } else {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current)
        heartbeatInterval.current = null
      }
    }

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current)
        heartbeatInterval.current = null
      }
    }
  }, [isConnected, gameId, sendHeartbeat])

  useEffect(() => {
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current)
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }

      disconnectEventStream()

      if (isConnected) {
        leaveGame()
      }
    }
  }, [isConnected, leaveGame, disconnectEventStream])

  return {
    gameState,
    isConnected,
    error,
    isReconnecting,
    reconnectAttempts,
    joinGame,
    leaveGame,
    spinBottle,
    resetGame,
  }
}
