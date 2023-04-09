import { GameMap } from "../gameMap"

// action.ts
export default abstract class Action {

	abstract generateRecommendation(gameState: Record<string, any>, gameMap: GameMap): Promise<RedisData.Recommendation>;

}
