import { Contract } from "ethers";
export declare type Token = {
    address: string;
    symbol: string;
    decimals: number;
};
export declare enum SwapType {
    GIVEN_IN = 0,
    GIVEN_OUT = 1
}
export declare const swapGivenIn: (vault: Contract, poolId: string, tokens: Token[], tokenInSymbol: string, tokenOutSymbol: string, amountIn: string) => Promise<string>;
export declare const swapGivenOut: (vault: Contract, poolId: string, tokens: Token[], tokenInSymbol: string, tokenOutSymbol: string, amountOut: string) => Promise<string>;
export declare const joinExactTokensInForBptOut: (helpers: Contract, poolId: string, tokens: Token[], amountsIn: string[]) => Promise<string>;
export declare const joinTokenInForExactBptOut: (helpers: Contract, poolId: string, tokens: Token[], tokenInSymbol: string, bptOut: string) => Promise<string>;
export declare const exitExactBptInForTokenOut: (helpers: Contract, poolId: string, tokens: Token[], tokenOutSymbol: string, bptIn: string) => Promise<string>;
export declare const exitExactBptInForTokensOut: (helpers: Contract, poolId: string, tokens: Token[], bptIn: string) => Promise<string[]>;
export declare const exitBptInForExactTokensOut: (helpers: Contract, poolId: string, tokens: Token[], amountsOut: string[]) => Promise<string>;
