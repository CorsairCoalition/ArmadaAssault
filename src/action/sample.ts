/// <reference path="../app.d.ts" />

// sampleAction.ts
import Action from './action.js'
import { Log, later, random } from '../utils.js'
import { GameMap } from '../gameMap.js'

export default class SampleAction extends Action {

  async generateRecommendation(gameState: Record<string, any>, gameMap: GameMap): Promise<RedisData.Recommendation> {
    let turn = gameState[RedisData.KEY.TURN]
    let width = gameState[RedisData.KEY.WIDTH]
    let height = gameState[RedisData.KEY.HEIGHT]
    let ownGeneral = gameState[RedisData.KEY.OWN_GENERAL]

    Log.debug('Turn:', turn, 'Width:', width, 'Height:', height, 'Own General:', ownGeneral)

    if (!turn) return

    if (random(1, 100) < 90) return

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

    // Return a recommendation
    return {
      interrupt: false,
      actions: [action],
      recommender: 'SampleAction',
      confidence: 0,
      priority: 0,
    };
  }
}
