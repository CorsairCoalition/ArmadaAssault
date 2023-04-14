import Action from './action.js'
import Algorithms from '../algorithms.js'
import GameMap from '../gameMap.js'

export default class Explore extends Action {

	nextMove: number = 12
	lastRecommendation: RedisData.Recommendation

	async generateRecommendation(gameState: Record<string, any>, gameMap: GameMap): Promise<RedisData.Recommendation> {
		let turn = gameState[RedisData.KEY.TURN]
		if (turn < this.nextMove) {
			return
		}

		const moveableTiles = gameMap.getMoveableTiles()
		const actions: GeneralsIO.Attack[] = []

		for (const start of moveableTiles) {
			const reachableTiles = Algorithms.bfs(gameMap, start, Number.MAX_VALUE)
			let furthestTile = reachableTiles.reduce((prev, current) => {
				return prev.generalDistance > current.generalDistance ? prev : current
			})

			const shortestPath = Algorithms.dijkstra(gameMap, start, furthestTile.index)

			for (let i = 0; i < shortestPath.length - 1; i++) {
				actions.push({
					start: shortestPath[i].start,
					end: shortestPath[i].end
				})
			}
		}

		if (actions.length === 0) {
			this.nextMove = turn + 5
			return
		}

		this.nextMove = turn + actions.length

		this.lastRecommendation = {
			interrupt: false,
			actions: actions,
			recommender: this.constructor.name,
			confidence: 0,
			priority: 0,
		}

		return this.lastRecommendation
	}
}
