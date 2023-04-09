export class GameMap {

	width: number
	height: number
	size: number
	playerIndex: number
	cities: number[] = []
	terrain: number[] = []
	armies: number[] = []
	ownTiles: Map<number, number> = new Map()
	discoveredTiles: boolean[] = []

	constructor(gameState: Record<string, any>) {
		this.width = gameState[RedisData.KEY.WIDTH]
		this.height = gameState[RedisData.KEY.HEIGHT]
		this.size = gameState[RedisData.KEY.SIZE]
		this.playerIndex = gameState[RedisData.KEY.PLAYER_INDEX]
	}

	public update(gameState: Record<string, any>) {
		this.cities = gameState[RedisData.KEY.CITIES]
		this.terrain = gameState[RedisData.KEY.MAP]
		this.armies = gameState[RedisData.KEY.ARMIES]
		this.ownTiles = gameState[RedisData.KEY.OWN_TILES]
		this.discoveredTiles = gameState[RedisData.KEY.DISCOVERED_TILES]
	}

	//needs a tile object with index and value field
	public isWalkable(tile: GeneralsIO.Tile) {
		return tile.value !== GeneralsIO.TILE.FOG_OBSTACLE &&
			tile.value !== GeneralsIO.TILE.OFF_LIMITS &&
			tile.value !== GeneralsIO.TILE.MOUNTAIN &&
			!this.isCity(tile)
	}

	public isCity(tile: GeneralsIO.Tile) {
		return this.cities.indexOf(tile.index) >= 0
	}

	public isEnemy(index: number) {
		return this.terrain[index] >= 0 && this.terrain[index] != this.playerIndex
	}

	public getAdjacentTiles(index: number) {
		let up = this.getAdjacentTile(index, -this.width)
		let right = this.getAdjacentTile(index, 1)
		let down = this.getAdjacentTile(index, this.width)
		let left = this.getAdjacentTile(index, -1)
		return {
			up, right, down, left
		}
	}

	public getAdjacentTile(index: number, distance: number) {
		let adjacentIndex = index + distance
		let curRow = Math.floor(index / this.width)
		let adjacentRow = Math.floor(adjacentIndex / this.width)

		switch(distance) {
			//search for either right or left neighbor
			case 1:
			case -1:
				//return only if it won't get out of grid bounds
				if(adjacentRow === curRow) {
					return {"index": adjacentIndex, "value": this.terrain[adjacentIndex]}
				}
				break
			//down
			case this.width:
				if(adjacentRow < this.height) {
					return {"index": adjacentIndex, "value": this.terrain[adjacentIndex]}
				}
				break
			//up
			case -this.width:
				if(adjacentRow >= 0) {
					return {"index": adjacentIndex, "value": this.terrain[adjacentIndex]}
				}
				break
		}
		return {"index": adjacentIndex, "value": GeneralsIO.TILE.OFF_LIMITS}
	}

	public isAdjacentToFog(index: number) {
		let adjacentTiles = this.getAdjacentTiles(index)
		//loop through adjacent tiles
		for(let direction in adjacentTiles) {
			if(adjacentTiles.hasOwnProperty(direction)) {
				let nextTile = adjacentTiles[direction]
				if(!this.discoveredTiles[nextTile.index]) {
					return true
				}
			}
		}
		return false
	}

	public isAdjacentToEnemy(index: number) {
		let adjacentTiles = this.getAdjacentTiles(index)
		//loop through adjacent tiles
		for(let direction in adjacentTiles) {
			if (adjacentTiles.hasOwnProperty(direction)) {
				let nextTile = adjacentTiles[direction]
				if(nextTile.value >= 0 && nextTile.value != this.playerIndex) {
					return true
				}
			}
		}
		return false
	}

	//takes a list of tiles and returns a list of all those with at least more than 1 unit
	public getMoveableTiles() {
		let tiles = []
		for (var [key, value] of this.ownTiles) {
			if(value > 1) {
				tiles.push(key)
			}
		}
		return tiles
	}

	public remainingArmiesAfterAttack(start: number, end: number) {
		if(start > 0 && start < this.size && end > 0 && end < this.size) {
			return this.armies[start] - 1 - this.armies[end]
		}
		return 0
	}

	//gets a calculated distance from closest edges
	//distance from closest edge * distance from closest edge on complementary side
	public getEdgeWeightForIndex(index: number) {
		let tileCoords = this.getCoordinatesFromTileIndex(index)
		let upperEdge = tileCoords.y
		let rightEdge = this.width - 1 - tileCoords.x
		let downEdge = this.height - 1 - tileCoords.y
		let leftEdge = tileCoords.x
		return Math.min(upperEdge, downEdge) * Math.min(leftEdge, rightEdge)
	}

	public manhattenDistance(index1: number, index2: number) {
		let coord1 = this.getCoordinatesFromTileIndex(index1)
		let coord2 = this.getCoordinatesFromTileIndex(index2)
		return Math.abs(coord1.x - coord2.x) + Math.abs(coord1.y - coord2.y)
	}

	public getCoordinatesFromTileIndex(index: number) {
		return {
			"x": Math.floor(index % this.width),
			"y": Math.floor(index / this.width)
		}
	}
}
