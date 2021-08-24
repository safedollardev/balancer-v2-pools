"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exitBptInForExactTokensOut = exports.exitExactBptInForTokensOut = exports.exitExactBptInForTokenOut = exports.joinTokenInForExactBptOut = exports.joinExactTokensInForBptOut = exports.swapGivenOut = exports.swapGivenIn = exports.SwapType = void 0;
const ethers_1 = require("ethers");
const encode = require("./encoding");
var SwapType;
(function (SwapType) {
    SwapType[SwapType["GIVEN_IN"] = 0] = "GIVEN_IN";
    SwapType[SwapType["GIVEN_OUT"] = 1] = "GIVEN_OUT";
})(SwapType = exports.SwapType || (exports.SwapType = {}));
const swapGivenIn = async (vault, poolId, tokens, tokenInSymbol, tokenOutSymbol, amountIn) => {
    const tokenOut = tokens.find((t) => t.symbol === tokenOutSymbol);
    const result = await batchSwap(vault, poolId, SwapType.GIVEN_IN, tokens, tokenInSymbol, tokenOutSymbol, amountIn);
    return ethers_1.utils.formatUnits(result.amountOut, tokenOut.decimals);
};
exports.swapGivenIn = swapGivenIn;
const swapGivenOut = async (vault, poolId, tokens, tokenInSymbol, tokenOutSymbol, amountOut) => {
    const tokenIn = tokens.find((t) => t.symbol === tokenInSymbol);
    const result = await batchSwap(vault, poolId, SwapType.GIVEN_OUT, tokens, tokenInSymbol, tokenOutSymbol, amountOut);
    return ethers_1.utils.formatUnits(result.amountIn, tokenIn.decimals);
};
exports.swapGivenOut = swapGivenOut;
const joinExactTokensInForBptOut = async (helpers, poolId, tokens, amountsIn) => {
    const userData = encode.joinUserData({
        kind: "ExactTokensInForBptOut",
        amountsIn: amountsIn.map((amount, i) => ethers_1.utils.parseUnits(amount, tokens[i].decimals).toString()),
        minimumBpt: "0",
    });
    const result = await join(helpers, poolId, tokens, userData);
    return ethers_1.utils.formatEther(result.bptOut);
};
exports.joinExactTokensInForBptOut = joinExactTokensInForBptOut;
const joinTokenInForExactBptOut = async (helpers, poolId, tokens, tokenInSymbol, bptOut) => {
    const tokenInIndex = tokens.findIndex((t) => t.symbol === tokenInSymbol);
    const userData = encode.joinUserData({
        kind: "TokenInForExactBptOut",
        bptOut: ethers_1.utils.parseEther(bptOut).toString(),
        tokenInIndex,
    });
    const result = await join(helpers, poolId, tokens, userData);
    return ethers_1.utils.formatUnits(result.amountsIn[tokenInIndex], tokens[tokenInIndex].decimals);
};
exports.joinTokenInForExactBptOut = joinTokenInForExactBptOut;
const exitExactBptInForTokenOut = async (helpers, poolId, tokens, tokenOutSymbol, bptIn) => {
    const tokenOutIndex = tokens.findIndex((t) => t.symbol === tokenOutSymbol);
    const userData = encode.exitUserData({
        kind: "ExactBptInForTokenOut",
        bptIn: ethers_1.utils.parseEther(bptIn).toString(),
        tokenOutIndex,
    });
    const result = await exit(helpers, poolId, tokens, userData);
    return ethers_1.utils.formatUnits(result.amountsOut[tokenOutIndex], tokens[tokenOutIndex].decimals);
};
exports.exitExactBptInForTokenOut = exitExactBptInForTokenOut;
const exitExactBptInForTokensOut = async (helpers, poolId, tokens, bptIn) => {
    const userData = encode.exitUserData({
        kind: "ExactBptInForTokensOut",
        bptIn: ethers_1.utils.parseEther(bptIn).toString(),
    });
    const result = await exit(helpers, poolId, tokens, userData);
    return result.amountsOut.map((amount, i) => ethers_1.utils.formatUnits(amount, tokens[i].decimals));
};
exports.exitExactBptInForTokensOut = exitExactBptInForTokensOut;
const exitBptInForExactTokensOut = async (helpers, poolId, tokens, amountsOut) => {
    const userData = encode.exitUserData({
        kind: "BptInForExactTokensOut",
        amountsOut: amountsOut.map((amount, i) => ethers_1.utils.parseUnits(amount, tokens[i].decimals).toString()),
        // Choose a value that cannot get exceeded
        maximumBpt: ethers_1.utils.parseEther("1000000000000000000").toString(),
    });
    const result = await exit(helpers, poolId, tokens, userData);
    return ethers_1.utils.formatEther(result.bptIn).toString();
};
exports.exitBptInForExactTokensOut = exitBptInForExactTokensOut;
const batchSwap = async (vault, poolId, swapType, tokens, tokenInSymbol, tokenOutSymbol, amount) => {
    const tokenIn = tokens.find((t) => t.symbol === tokenInSymbol);
    const tokenOut = tokens.find((t) => t.symbol === tokenOutSymbol);
    // Returns: [tokenInDelta, tokenOutDelta]
    const [tokenInDelta, tokenOutDelta] = await vault.queryBatchSwap(swapType, [
        {
            poolId,
            assetInIndex: 0,
            assetOutIndex: 1,
            amount: swapType === SwapType.GIVEN_IN
                ? ethers_1.utils.parseUnits(amount, tokenIn.decimals)
                : ethers_1.utils.parseUnits(amount, tokenOut.decimals),
            userData: "0x",
        },
    ], [tokenIn.address, tokenOut.address], {
        sender: ethers_1.constants.AddressZero,
        fromInternalBalance: false,
        recipient: ethers_1.constants.AddressZero,
        toInternalBalance: false,
    });
    return {
        amountIn: tokenInDelta,
        amountOut: tokenOutDelta.mul(-1),
    };
};
const join = async (helpers, poolId, tokens, userData) => {
    // These values are not actually used by the helper contract
    const maxAmountsIn = tokens.map(() => "0");
    // Returns: { bptOut, amountsIn }
    return helpers.queryJoin(poolId, ethers_1.constants.AddressZero, ethers_1.constants.AddressZero, {
        assets: tokens.map((t) => t.address),
        maxAmountsIn,
        fromInternalBalance: false,
        userData,
    });
};
const exit = async (helpers, poolId, tokens, userData) => {
    // These values are not actually used by the helper contract
    const minAmountsOut = tokens.map(() => "0");
    // Returns { bptIn, amountsOut }
    return helpers.queryExit(poolId, ethers_1.constants.AddressZero, ethers_1.constants.AddressZero, {
        assets: tokens.map((t) => t.address),
        minAmountsOut,
        toInternalBalance: false,
        userData,
    });
};
