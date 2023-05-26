import Action from './action.js'
import GameMap from '../gameMap.js'

export default class Spread extends Action {

	nextMove: number = 12
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
			let maxRemainingArmies = 0

			for (const direction in adjacentTiles) {
				if (adjacentTiles.hasOwnProperty(direction)) {
					const targetTile = adjacentTiles[direction]

					if (gameMap.isWalkable(targetTile)) {
						const remainingArmies = gameMap.remainingArmiesAfterAttack(start, targetTile.index)

						if ((gameMap.isAdjacentToFog(targetTile.index) || remainingArmies > 0) && remainingArmies > maxRemainingArmies) {
							bestTargetTile = targetTile
							maxRemainingArmies = remainingArmies
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
