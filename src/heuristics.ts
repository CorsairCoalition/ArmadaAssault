import GameMap from "./gameMap.js"

export default class Heuristics {

	//TODO: choose by manhattan distance, not breadth search distance
	//returns the furthest possible tile index from the general, with maximum distance to edge
	//tiles are arrays of Objects with index and generalDistance properties
	// tiles returned by Algorithms.bfs
	static chooseDiscoverTile(gameMap: GameMap, tiles: {index: number, generalDistance: number}[]) {
		// let generalCoords = gameMap.getCoordinatesFromTileIndex(gameMap.ownGeneral)

		let optimalTile = {"index": -1, "edgeWeight": -1}

		let maxGeneralDistance = tiles[tiles.length -1].generalDistance

		//first elements are the closest to the general
		for(let i = tiles.length - 1; i >= 0; i--) {
			let tile = tiles[i]
			let edgeWeight = gameMap.getEdgeWeightForIndex(tile.index)

			//general distance is not at maximum anymore. ignore other tiles
			if(tile.generalDistance < maxGeneralDistance) {
				return optimalTile.index
			}

			//a tile with maximum generalDistance and
			if(edgeWeight > optimalTile.edgeWeight) {
				optimalTile.index = tile.index
				optimalTile.edgeWeight = edgeWeight
			}
		}

		//loop stopped, but optimal tile was found(meaning it was only 1 step away from general)
		if(optimalTile.index != -1) {
			return optimalTile.index
		} else {
			console.log("No tile found. Something is going wrong here!")
		}

		return null
	}

	//find an enemy tile adjcaent to fog with a minimum army value
	static chooseEnemyTargetTileByLowestArmy(gameMap: GameMap) {
		let tilesWithFog = []

		//loop through all visible enemy tiles
		for (let [key, value] of gameMap.enemyTiles) {
			if(gameMap.isAdjacentToFog(key)) {
				tilesWithFog.push({"index": key, "value": value})
			}
		}
		if(tilesWithFog.length == 0) {
			return null
		}

		//find one with lowest army value
		return tilesWithFog.reduce((a, b) =>
			(a.value < b.value) ? a : b
		)
	}

	static calcCaptureWeight(playerIndex: number, terrainValue: GeneralsIO.TILE) {
		if(terrainValue == playerIndex) {
			return 0	// own tile
		} else if(terrainValue == GeneralsIO.TILE.EMPTY || terrainValue == GeneralsIO.TILE.FOG) {
			return 1	// empty tile
		} else if(terrainValue < 0) {
			return 3	// enemy tile
		}
		return 1
	}
}
