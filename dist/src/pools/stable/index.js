"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../subgraph/index");
const big_number_1 = require("../../utils/big-number");
const common_1 = require("../../utils/common");
const base_1 = require("../base");
const math = require("./math");
class StablePool extends base_1.default {
    // ---------------------- Constructor ----------------------
    constructor(params) {
        super(params);
        if (params.tokens.length > math.MAX_STABLE_TOKENS) {
            throw new Error("MAX_STABLE_TOKENS");
        }
        this._tokens = common_1.shallowCopyAll(params.tokens);
        if (big_number_1.bn(params.amplificationParameter).lt(math.MIN_AMP)) {
            throw new Error("MIN_AMP");
        }
        if (big_number_1.bn(params.amplificationParameter).gt(math.MAX_AMP)) {
            throw new Error("MAX_AMP");
        }
        this._amplificationParameter = big_number_1.bn(params.amplificationParameter)
            .times(math.AMP_PRECISION)
            .toString();
    }
    // ---------------------- Getters ----------------------
    get tokens() {
        // Shallow-copy to disallow direct changes
        return common_1.shallowCopyAll(this._tokens);
    }
    get amplificationParameter() {
        return big_number_1.bn(this._amplificationParameter).idiv(math.AMP_PRECISION).toString();
    }
    // ---------------------- Subgraph initializer ----------------------
    static async initFromRealPool(poolId, query = false, blockNumber, testnet) {
        const pool = await index_1.getPool(poolId, blockNumber, testnet);
        if (!pool) {
            throw new Error("Could not fetch pool data");
        }
        if (pool.poolType !== "Stable") {
            throw new Error("Pool must be stable");
        }
        const id = pool.id;
        const address = pool.address;
        const bptTotalSupply = pool.totalShares;
        const swapFeePercentage = pool.swapFee;
        const amplificationParameter = pool.amp;
        const tokens = [];
        for (const token of pool.tokens) {
            tokens.push({
                address: token.address,
                symbol: token.symbol,
                balance: token.balance,
                decimals: token.decimals,
            });
        }
        return new StablePool({
            id,
            address,
            tokens,
            bptTotalSupply,
            swapFeePercentage,
            amplificationParameter,
            query,
        });
    }
    // ---------------------- Swap actions ----------------------
    swapGivenIn(tokenInSymbol, tokenOutSymbol, amountIn) {
        const tokenIndexIn = this._tokens.findIndex((t) => t.symbol === tokenInSymbol);
        const tokenIndexOut = this._tokens.findIndex((t) => t.symbol === tokenOutSymbol);
        const tokenIn = this._tokens[tokenIndexIn];
        const tokenOut = this._tokens[tokenIndexOut];
        const scaledAmountOut = math._calcOutGivenIn(big_number_1.bn(this._amplificationParameter), this._tokens.map((t) => this._upScale(t.balance, t.decimals)), tokenIndexIn, tokenIndexOut, this._upScale(amountIn, tokenIn.decimals), this._upScale(this._swapFeePercentage, 18));
        const amountOut = this._downScaleDown(scaledAmountOut, tokenOut.decimals);
        // In-place balance updates
        if (!this._query) {
            tokenIn.balance = big_number_1.bn(tokenIn.balance).plus(amountIn).toString();
            tokenOut.balance = big_number_1.bn(tokenOut.balance).minus(amountOut).toString();
        }
        return amountOut.toString();
    }
    swapGivenOut(tokenInSymbol, tokenOutSymbol, amountOut) {
        const tokenIndexIn = this._tokens.findIndex((t) => t.symbol === tokenInSymbol);
        const tokenIndexOut = this._tokens.findIndex((t) => t.symbol === tokenOutSymbol);
        const tokenIn = this._tokens[tokenIndexIn];
        const tokenOut = this._tokens[tokenIndexOut];
        const scaledAmountIn = math._calcInGivenOut(big_number_1.bn(this._amplificationParameter), this._tokens.map((t) => this._upScale(t.balance, t.decimals)), tokenIndexIn, tokenIndexOut, this._upScale(amountOut, tokenOut.decimals), this._upScale(this._swapFeePercentage, 18));
        const amountIn = this._downScaleUp(scaledAmountIn, tokenIn.decimals);
        // In-place balance updates
        if (!this._query) {
            tokenIn.balance = big_number_1.bn(tokenIn.balance).plus(amountIn).toString();
            tokenOut.balance = big_number_1.bn(tokenOut.balance).minus(amountOut).toString();
        }
        return amountIn.toString();
    }
    // ---------------------- LP actions ----------------------
    joinExactTokensInForBptOut(amountsIn) {
        if (Object.keys(amountsIn).length !== this._tokens.length) {
            throw new Error("Invalid input");
        }
        const scaledBptOut = math._calcBptOutGivenExactTokensIn(big_number_1.bn(this._amplificationParameter), this._tokens.map((t) => this._upScale(t.balance, t.decimals)), this._tokens.map((t) => this._upScale(amountsIn[t.symbol], t.decimals)), this._upScale(this._bptTotalSupply, 18), this._upScale(this._swapFeePercentage, 18));
        const bptOut = this._downScaleDown(scaledBptOut, 18);
        // In-place balance updates
        if (!this._query) {
            for (let i = 0; i < this._tokens.length; i++) {
                const token = this._tokens[i];
                token.balance = big_number_1.bn(token.balance)
                    .plus(amountsIn[token.symbol])
                    .toString();
            }
            this._bptTotalSupply = big_number_1.bn(this._bptTotalSupply).plus(bptOut).toString();
        }
        return bptOut.toString();
    }
    joinTokenInForExactBptOut(tokenInSymbol, bptOut) {
        const tokenIndex = this._tokens.findIndex((t) => t.symbol === tokenInSymbol);
        const tokenIn = this._tokens[tokenIndex];
        if (!tokenIn) {
            throw new Error("Invalid input");
        }
        const scaledAmountIn = math._calcTokenInGivenExactBptOut(big_number_1.bn(this._amplificationParameter), this._tokens.map((t) => this._upScale(t.balance, t.decimals)), tokenIndex, this._upScale(bptOut, 18), this._upScale(this._bptTotalSupply, 18), this._upScale(this._swapFeePercentage, 18));
        const amountIn = this._downScaleUp(scaledAmountIn, tokenIn.decimals);
        // In-place balance updates
        if (!this._query) {
            tokenIn.balance = big_number_1.bn(tokenIn.balance).plus(amountIn).toString();
            this._bptTotalSupply = big_number_1.bn(this._bptTotalSupply).plus(bptOut).toString();
        }
        return amountIn.toString();
    }
    exitExactBptInForTokenOut(tokenOutSymbol, bptIn) {
        const tokenIndex = this._tokens.findIndex((t) => t.symbol === tokenOutSymbol);
        const tokenOut = this._tokens[tokenIndex];
        if (!tokenOut) {
            throw new Error("Invalid input");
        }
        const scaledAmountOut = math._calcTokenOutGivenExactBptIn(big_number_1.bn(this._amplificationParameter), this._tokens.map((t) => this._upScale(t.balance, t.decimals)), tokenIndex, this._upScale(bptIn, 18), this._upScale(this._bptTotalSupply, 18), this._upScale(this._swapFeePercentage, 18));
        const amountOut = this._downScaleDown(scaledAmountOut, tokenOut.decimals);
        // In-place balance updates
        if (!this._query) {
            tokenOut.balance = big_number_1.bn(tokenOut.balance).minus(amountOut).toString();
            this._bptTotalSupply = big_number_1.bn(this._bptTotalSupply).minus(bptIn).toString();
        }
        return amountOut.toString();
    }
    exitExactBptInForTokensOut(bptIn) {
        // Exactly match the EVM version
        if (big_number_1.bn(bptIn).gt(this._bptTotalSupply)) {
            throw new Error("BPT in exceeds total supply");
        }
        const scaledAmountsOut = math._calcTokensOutGivenExactBptIn(this._tokens.map((t) => this._upScale(t.balance, t.decimals)), this._upScale(bptIn, 18), this._upScale(this._bptTotalSupply, 18));
        const amountsOut = scaledAmountsOut.map((amount, i) => this._downScaleDown(amount, this._tokens[i].decimals));
        // In-place balance updates
        if (!this._query) {
            for (let i = 0; i < this._tokens.length; i++) {
                const token = this._tokens[i];
                token.balance = big_number_1.bn(token.balance).minus(amountsOut[i]).toString();
            }
            this._bptTotalSupply = big_number_1.bn(this._bptTotalSupply).minus(bptIn).toString();
        }
        return amountsOut.map((a) => a.toString());
    }
    exitBptInForExactTokensOut(amountsOut) {
        if (Object.keys(amountsOut).length !== this._tokens.length) {
            throw new Error("Invalid input");
        }
        const scaledBptIn = math._calcBptInGivenExactTokensOut(big_number_1.bn(this._amplificationParameter), this._tokens.map((t) => this._upScale(t.balance, t.decimals)), this._tokens.map((t) => this._upScale(amountsOut[t.symbol], t.decimals)), this._upScale(this._bptTotalSupply, 18), this._upScale(this._swapFeePercentage, 18));
        const bptIn = this._downScaleDown(scaledBptIn, 18);
        // In-place balance updates
        if (!this._query) {
            for (let i = 0; i < this._tokens.length; i++) {
                const token = this._tokens[i];
                token.balance = big_number_1.bn(token.balance)
                    .minus(amountsOut[token.symbol])
                    .toString();
            }
            this._bptTotalSupply = big_number_1.bn(this._bptTotalSupply).minus(bptIn).toString();
        }
        return bptIn.toString();
    }
}
exports.default = StablePool;
