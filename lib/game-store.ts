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

// In-memory store for game sessions
const gameStore = new Map<string, GameState>()

const activeConnections = new Map<string, Set<string>>() // gameId -> Set of playerIds

export function createGame(): string {
  const gameId = Math.random().toString(36).substring(2, 8).toUpperCase()

  const gameState: GameState = {
    gameId,
    players: [],
    currentPlayer: 0,
    isSpinning: false,
    currentResult: null,
    gameHistory: [],
    createdAt: new Date(),
    lastActivity: new Date(),
  }

  gameStore.set(gameId, gameState)
  activeConnections.set(gameId, new Set())
  return gameId
}

export function getGame(gameId: string): GameState | null {
  return gameStore.get(gameId) || null
}

export function updateGame(gameId: string, updates: Partial<GameState>): GameState | null {
  const game = gameStore.get(gameId)
  if (!game) return null

  const updatedGame = {
    ...game,
    ...updates,
    lastActivity: new Date(),
  }

  gameStore.set(gameId, updatedGame)
  return updatedGame
}

export function joinGame(gameId: string, playerId: string, playerName: string): GameState | null {
  const game = gameStore.get(gameId)
  if (!game) return null

  // Check if player already exists
  const existingPlayerIndex = game.players.findIndex((p) => p.id === playerId)

  if (existingPlayerIndex >= 0) {
    game.players[existingPlayerIndex].connected = true
    game.players[existingPlayerIndex].lastSeen = new Date()
  } else if (game.players.length < 2) {
    // Add new player if room available
    game.players.push({
      id: playerId,
      name: playerName,
      connected: true,
      lastSeen: new Date(),
    })
  } else {
    return null // Game is full
  }

  const connections = activeConnections.get(gameId) || new Set()
  connections.add(playerId)
  activeConnections.set(gameId, connections)

  return updateGame(gameId, { players: game.players })
}

export function leaveGame(gameId: string, playerId: string): GameState | null {
  const game = gameStore.get(gameId)
  if (!game) return null

  const playerIndex = game.players.findIndex((p) => p.id === playerId)
  if (playerIndex >= 0) {
    game.players[playerIndex].connected = false
    game.players[playerIndex].lastSeen = new Date()
  }

  const connections = activeConnections.get(gameId)
  if (connections) {
    connections.delete(playerId)
  }

  return updateGame(gameId, { players: game.players })
}

export function updatePlayerHeartbeat(gameId: string, playerId: string): boolean {
  const game = gameStore.get(gameId)
  if (!game) return false

  const playerIndex = game.players.findIndex((p) => p.id === playerId)
  if (playerIndex >= 0) {
    game.players[playerIndex].lastSeen = new Date()
    game.players[playerIndex].connected = true

    // Update active connections
    const connections = activeConnections.get(gameId) || new Set()
    connections.add(playerId)
    activeConnections.set(gameId, connections)

    updateGame(gameId, { players: game.players })
    return true
  }
  return false
}

export function checkPlayerConnections(): void {
  const HEARTBEAT_TIMEOUT = 15 * 1000 // 15 seconds
  const now = new Date()

  for (const [gameId, game] of gameStore.entries()) {
    let hasDisconnections = false

    for (let i = 0; i < game.players.length; i++) {
      const player = game.players[i]
      const timeSinceLastSeen = now.getTime() - player.lastSeen.getTime()

      if (player.connected && timeSinceLastSeen > HEARTBEAT_TIMEOUT) {
        game.players[i].connected = false
        hasDisconnections = true

        const connections = activeConnections.get(gameId)
        if (connections) {
          connections.delete(player.id)
        }
      }
    }

    if (hasDisconnections) {
      updateGame(gameId, { players: game.players })
    }
  }
}

export function cleanupInactiveGames(): void {
  const now = new Date()
  const INACTIVE_THRESHOLD = 30 * 60 * 1000 // 30 minutes

  for (const [gameId, game] of gameStore.entries()) {
    const hasConnectedPlayers = game.players.some((p) => p.connected)
    const isVeryOld = now.getTime() - game.lastActivity.getTime() > INACTIVE_THRESHOLD

    if (!hasConnectedPlayers || isVeryOld) {
      gameStore.delete(gameId)
      activeConnections.delete(gameId)
    }
  }
}

setInterval(checkPlayerConnections, 5 * 1000)

// Cleanup inactive games every 10 minutes
setInterval(cleanupInactiveGames, 10 * 60 * 1000)
