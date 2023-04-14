/// <reference path="./app.d.ts" />

import { Log } from './utils.js'
import { Redis } from './redis.js'
import Action from './action/action.js'
import GameMap from './gameMap.js'

export class App {
	private redis: Redis
	private actions: Action[] = [];
	private gameMap: GameMap
	private gameMapInitialized = false

	constructor(config: any, actionNames: string[]) {
		config.redisConfig.CHANNEL_PREFIX = config.BOT_CLASS + '-' + config.botId
		this.initialize(config, actionNames)
	}

	private async initialize(config: any, actionNames: string[]) {
		await this.instantiateActions(actionNames)
		await this.initializeRedisConnection(config.redisConfig).then(() => {
			Log.stdout('Redis connected')
		})
	}

	private async instantiateActions(actionNames: string[]) {
		for (const actionName of actionNames) {
			try {
				const actionModule = await import(`./action/${actionName}.js`)
				const actionClass = actionModule.default
				const actionInstance = new actionClass()
				this.actions.push(actionInstance)
			} catch (error) {
				Log.stderr(`Error initializing action "${actionName}"`)
				console.error(error)
				process.exit(2)
			}
		}
	}

	private initializeRedisConnection = async (redisConfig: Config.Redis) => {
		this.redis = new Redis(redisConfig)
		await this.redis.connect()
		// this.redis.subscribe(RedisData.CHANNEL.GAME_UPDATE, this.handleGameUpdates)
		this.redis.subscribe(RedisData.CHANNEL.TURN, this.handleTurnUpdates)
		return this.redis.subscribe(RedisData.CHANNEL.STATE, this.handleStateUpdates)
	}

	private handleStateUpdates = (state: RedisData.State) => {
		Log.debug('State update: ' + JSON.stringify(state))

		let eventType = Object.keys(state)[0]

		switch (eventType) {
			case 'joined' || 'left':
				Log.stdout('Bot', eventType)
				return
			case 'game_start':
				Log.stdout('Game started')
				this.redis.setKeyspace(state.game_start.replay_id)
				this.gameMapInitialized = false
				return
			case 'game_won' || 'game_lost':
				Log.stdout('Game ended:', eventType)
				return
		}
	}

	// private handleGameUpdates = (game: GeneralsIO.GameUpdate) => {
	// }

	private handleTurnUpdates = async (turn: number) => {
		const gameState = await this.redis.getAllGameKeys()

		if (!this.gameMapInitialized) {
			this.gameMapInitialized = true
			this.gameMap = new GameMap(gameState)
		}

		this.gameMap.update(gameState)

		for (const action of this.actions) {
			const recommendation = await action.generateRecommendation(gameState, this.gameMap)
			if (recommendation) {
				this.redis.publish(RedisData.CHANNEL.RECOMMENDATION, recommendation)
			}
		}
	}

	public quit = async () => {
		Log.stdout('quitting')
		return this.redis.quit()
	}
}
