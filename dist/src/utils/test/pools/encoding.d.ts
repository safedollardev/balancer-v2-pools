export declare type ExactTokensInForBptOut = {
    kind: "ExactTokensInForBptOut";
    amountsIn: string[];
    minimumBpt: string;
};
export declare type TokenInForExactBptOut = {
    kind: "TokenInForExactBptOut";
    bptOut: string;
    tokenInIndex: number;
};
export declare function joinUserData(joinData: ExactTokensInForBptOut | TokenInForExactBptOut): string;
export declare type ExactBptInForTokenOut = {
    kind: "ExactBptInForTokenOut";
    bptIn: string;
    tokenOutIndex: number;
};
export declare type ExactBptInForTokensOut = {
    kind: "ExactBptInForTokensOut";
    bptIn: string;
};
export declare type BptInForExactTokensOut = {
    kind: "BptInForExactTokensOut";
    amountsOut: string[];
    maximumBpt: string;
};
export declare function exitUserData(exitData: ExactBptInForTokenOut | ExactBptInForTokensOut | BptInForExactTokensOut): string;
