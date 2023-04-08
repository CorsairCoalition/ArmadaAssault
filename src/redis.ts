/// <reference path="./app.d.ts" />

import { createClient, RedisClientType } from '@redis/client'
import { Log } from './utils.js'

export class Redis {

	private publisher: RedisClientType
	private subscriber: RedisClientType
	private CHANNEL_PREFIX: string
	private gameKeyspace: string

	constructor(redisConfig: Config.Redis) {
		this.CHANNEL_PREFIX = redisConfig.CHANNEL_PREFIX

		let connectionObj = {
			url: `rediss://${redisConfig.USERNAME}:${redisConfig.PASSWORD}@${redisConfig.HOST}:${redisConfig.PORT}`,
			socket: {
				tls: true,
				servername: redisConfig.HOST,
			}
		}

		this.subscriber = createClient(connectionObj)
		this.publisher = createClient(connectionObj)
		this.subscriber.on('error', (error: Error) => Log.stderr(`[Redis] ${error}`))
		this.publisher.on('error', (error: Error) => Log.stderr(`[Redis] ${error}`))
	}

	public connect = () => Promise.all([
		this.publisher.connect(),
		this.subscriber.connect()
	])

	public setKeyspace = (replay_id: string) => {
		this.gameKeyspace = this.CHANNEL_PREFIX + '-' + replay_id
	}

	public async getGameKeys(...keys: Array<string>) {
		// JSON.parse each value
		let valuesArr = await this.publisher.hmGet(this.gameKeyspace, keys)
		let values = {}
		for (let key in valuesArr) {
			values[keys[key]] = JSON.parse(valuesArr[key])
		}
		return values
	}

	public async getAllGameKeys() {
		// JSON.parse each value
		let values = await this.publisher.hGetAll(this.gameKeyspace)
		for (let key in values) {
			values[key] = JSON.parse(values[key])
		}
		return values
	}

	public publish(channel: RedisData.CHANNEL, data: any) {
		Log.debug('[Redis] publish', channel, JSON.stringify(data))
		return this.publisher.publish(this.CHANNEL_PREFIX + '-' + channel, JSON.stringify(data))
	}

	public async subscribe(channel: RedisData.CHANNEL, callback: (data: any) => void) {
		const CHANNEL_NAME = this.CHANNEL_PREFIX + '-' + channel
		Log.debug('[Redis] subscribe:', CHANNEL_NAME)
		let handleData = (message: string) => {
			let data: any
			try {
				data = JSON.parse(message)
			} catch (error) {
				Log.stderr('[JSON] received:', message, ', error:', error)
				return
			}
			callback(data)
		}
		await this.subscriber.subscribe(CHANNEL_NAME, handleData)
		Log.debug('[Redis] subscribed:', CHANNEL_NAME)
		return CHANNEL_NAME
	}

	public quit() {
		this.subscriber.quit()
		return this.publisher.quit()
	}
}
