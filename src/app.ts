/// <reference path="./app.d.ts" />

import { Log, later, random } from './utils.js'
import { Redis } from './redis.js'
import Action from './action/action.js'

export class App {
	private redis: Redis
	private replay_id: string
	private playing: boolean = false
	private actions: Action[] = [];

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
				this.playing = false
				Log.stdout('Bot', eventType)
				return
			case 'game_start':
				this.playing = true
				Log.stdout('Game started')
				this.replay_id = state.game_start.replay_id
				this.redis.setKeyspace(this.replay_id)
				return
			case 'game_won' || 'game_lost':
				this.playing = false
				Log.stdout('Game ended:', eventType)
				return
		}
	}

	// private handleGameUpdates = (game: GeneralsIO.GameUpdate) => {
	// }

	private handleTurnUpdates = async (turn: number) => {
		for (const action of this.actions) {
			const gameState = await this.redis.getAllGameKeys()
			const recommendation = await action.generateRecommendation(gameState)
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
