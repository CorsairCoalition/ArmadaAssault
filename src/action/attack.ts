import Action from './action.js'
import Algorithms from '../algorithms.js'
import GameMap from '../gameMap.js'

export default class Attack extends Action {

	nextMove: number = 30
	lastRecommendation: RedisData.Recommendation

	async generateRecommendation(gameState: Record<string, any>, gameMap: GameMap): Promise<RedisData.Recommendation> {
		let turn = gameState[RedisData.KEY.TURN]
		if (turn < this.nextMove) {
			return null
		}

		const moveableTiles = gameMap.getMoveableTiles()
		const actions: GeneralsIO.Attack[] = []

		for (const start of moveableTiles) {
			const adjacentTiles = gameMap.getAdjacentTiles(start)
			let bestTargetTile: GeneralsIO.Tile | null = null
			let maxEnemyLand = 0

			for (const direction in adjacentTiles) {
				if (adjacentTiles.hasOwnProperty(direction)) {
					const targetTile = adjacentTiles[direction];

					if (gameMap.isEnemy(targetTile)) {
						const enemyLand = Algorithms.bfs(gameMap, targetTile, Infinity);
						const enemyLandCount = enemyLand.filter(tile => gameMap.isEnemy(tile)).length;

						if (enemyLandCount > maxEnemyLand) {
							bestTargetTile = targetTile;
							maxEnemyLand = enemyLandCount;
						}
					}
				}
			}

			if (bestTargetTile) {
				actions.push({
					start: start,
					end: bestTargetTile.index
				})
			}
		}

		if (actions.length === 0) {
			this.nextMove = turn + 5
			return null
		}

		this.nextMove = turn + Math.min(actions.length, 5)

		this.lastRecommendation = {
			date: new Date(),
			interrupt: false,
			actions: actions,
			recommender: this.constructor.name,
			confidence: 0,
			priority: 1,
		}

		return this.lastRecommendation
	}
}
