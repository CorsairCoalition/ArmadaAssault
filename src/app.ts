/// <reference path="./app.d.ts" />

import { Log, later, random } from './utils.js'
import { Redis } from './redis.js'

export class App {
	private redis: Redis
	private replay_id: string
	private playing: boolean = false

	constructor(config: any) {
		config.redisConfig.CHANNEL_PREFIX = config.BOT_CLASS + '-' + config.botId

		this.initializeRedisConnection(config.redisConfig).then(() => {
			Log.stdout('Redis connected')
		})
	}

	private initializeRedisConnection = async (redisConfig: Config.Redis) => {
		this.redis = new Redis(redisConfig)
		await this.redis.connect()
		// await this.redis.subscribe(RedisData.CHANNEL.GAME_UPDATE, this.handleGameUpdates)
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
				later(1000).then(this.generateRecommendation)
				return
			case 'game_won' || 'game_lost':
				this.playing = false
				Log.stdout('Game ended:', eventType)
				return
		}
	}

	private handleGameUpdates = (game: GeneralsIO.GameUpdate) => {
	}

	private generateRecommendation = async () => {
		if (!this.playing) return

		let values = await this.redis.getGameKeys(RedisData.KEY.TURN, RedisData.KEY.WIDTH, RedisData.KEY.HEIGHT, RedisData.KEY.OWN_GENERAL)
		let turn = values[RedisData.KEY.TURN]
		let width = values[RedisData.KEY.WIDTH]
		let height = values[RedisData.KEY.HEIGHT]
		let ownGeneral = values[RedisData.KEY.OWN_GENERAL]

		Log.debug('Turn:', turn, 'Width:', width, 'Height:', height, 'Own General:', ownGeneral)

		if (!turn) return

		let end: number

		switch (turn % 4) {
			case 0:
				end = ownGeneral - width
				break
			case 1:
				end = ownGeneral + 1
				break
			case 2:
				end = ownGeneral + width
				break
			case 3:
				end = ownGeneral - 1
				break
		}

		let action: GeneralsIO.Attack = {
			start: ownGeneral,
			end: end
		}

		let recommendation: RedisData.Recommendation = {
			interrupt: false,
			actions: [action],
		}

		later(random(1000, 3000)).then(this.generateRecommendation)

		return this.redis.publish(RedisData.CHANNEL.RECOMMENDATION, recommendation)
	}

	public quit = async () => {
		Log.stdout('quitting')
		return this.redis.quit()
	}
}
