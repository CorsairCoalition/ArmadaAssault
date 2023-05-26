import Action from './action.js'
import Algorithms from '../algorithms.js'
import GameMap from '../gameMap.js'

export default class Explore extends Action {

	nextMove: number = 24
	lastRecommendation: RedisData.Recommendation

	async generateRecommendation(gameState: Record<string, any>, gameMap: GameMap): Promise<RedisData.Recommendation> {
		let turn = gameState[RedisData.KEY.TURN]
		if (turn < this.nextMove) {
			return null
		}

		const moveableTiles = gameMap.getMoveableTiles()
		const actions: GeneralsIO.Attack[] = []

		for (const start of moveableTiles) {
			const armiesAvailable = gameState['armies'][start] - 1
			if (armiesAvailable > 0) {
				const reachableTiles = Algorithms.bfs(gameMap, start, armiesAvailable)
				let furthestTile = reachableTiles.reduce((prev, current) => {
					return prev.generalDistance > current.generalDistance ? prev : current
				})

				const shortestPath = Algorithms.dijkstra(gameMap, start, furthestTile.index)
				const numActions = Math.min(armiesAvailable, shortestPath.length)

				for (let i = 0; i < numActions; i++) {
					actions.push({
						start: shortestPath[i].start,
						end: shortestPath[i].end
					})
				}
			}
		}

		if (actions.length === 0) {
			this.nextMove = turn + 5
			return null
		}

		this.nextMove = turn + actions.length

		this.lastRecommendation = {
			date: new Date(),
			interrupt: false,
			actions: actions,
			recommender: this.constructor.name,
			confidence: 0,
			priority: 0,
		}

		return this.lastRecommendation
	}
}
