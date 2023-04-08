// action.ts
export default abstract class Action {

	abstract generateRecommendation(values: Record<string, any>): Promise<RedisData.Recommendation>;

}
