/// <reference path="./app.d.ts" />

import { Log } from './utils.js'
import { Redis } from './redis.js'
import Action from './action/action.js'
import GameMap from './gameMap.js'

export class App {
	private redis: Redis
	private actions: Action[] = [];
	private gameMap: GameMap
	// private gameMapInitialized = false
	private currentReplayId: string

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
		this.redis.subscribe(RedisData.CHANNEL.TURN, this.handleTurnUpdates)
	}

	private handleTurnUpdates = async (data: any) => {
		if (!data.replay_id || !data.turn) {
			Log.stderr('Turn Update Invalid.', 'replay_id:', data.replay_id, ', turn: ' + data.turn)
			return
		}

		const gameState = await this.redis.getAllKeys(data.replay_id)

		let replayId = gameState[RedisData.KEY.REPLAY_ID]
		if (this.currentReplayId !== replayId) {
			this.currentReplayId = replayId
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
