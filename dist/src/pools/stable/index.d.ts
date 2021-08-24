import BasePool, { IBasePoolParams, IBasePoolToken } from "../base";
export interface IStablePoolToken extends IBasePoolToken {
}
export interface IStablePoolParams extends IBasePoolParams {
    tokens: IStablePoolToken[];
    amplificationParameter: string;
}
export default class StablePool extends BasePool {
    private _tokens;
    private _amplificationParameter;
    get tokens(): IStablePoolToken[];
    get amplificationParameter(): string;
    constructor(params: IStablePoolParams);
    static initFromRealPool(poolId: string, query?: boolean, blockNumber?: number, testnet?: boolean): Promise<StablePool>;
    swapGivenIn(tokenInSymbol: string, tokenOutSymbol: string, amountIn: string): string;
    swapGivenOut(tokenInSymbol: string, tokenOutSymbol: string, amountOut: string): string;
    joinExactTokensInForBptOut(amountsIn: {
        [symbol: string]: string;
    }): string;
    joinTokenInForExactBptOut(tokenInSymbol: string, bptOut: string): string;
    exitExactBptInForTokenOut(tokenOutSymbol: string, bptIn: string): string;
    exitExactBptInForTokensOut(bptIn: string): string[];
    exitBptInForExactTokensOut(amountsOut: {
        [symbol: string]: string;
    }): string;
}
