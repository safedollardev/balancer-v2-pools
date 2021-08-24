"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../subgraph/index");
const big_number_1 = require("../../utils/big-number");
const common_1 = require("../../utils/common");
const base_1 = require("../base");
const math = require("./math");
class WeightedPool extends base_1.default {
    // ---------------------- Constructor ----------------------
    constructor(params) {
        super(params);
        this.MIN_TOKENS = 2;
        this.MAX_TOKENS = 8;
        // A minimum normalized weight imposes a maximum weight ratio
        // We need this due to limitations in the implementation of the power function, as these ratios are often exponents
        this.MIN_WEIGHT = big_number_1.bn("0.01"); // 0.01e18
        if (params.tokens.length < this.MIN_TOKENS) {
            throw new Error("MIN_TOKENS");
        }
        if (params.tokens.length > this.MAX_TOKENS) {
            throw new Error("MAX_TOKENS");
        }
        this._tokens = common_1.shallowCopyAll(params.tokens);
        let normalizedSum = big_number_1.bn(0);
        for (let i = 0; i < params.tokens.length; i++) {
            if (big_number_1.bn(params.tokens[i].weight).lt(this.MIN_WEIGHT)) {
                throw new Error("MIN_WEIGHT");
            }
            normalizedSum = normalizedSum.plus(params.tokens[i].weight);
        }
        if (!normalizedSum.eq(1)) {
            throw new Error("NORMALIZED_WEIGHT_INVARIANT");
        }
    }
    // ---------------------- Getters ----------------------
    get tokens() {
        // Shallow-copy to disallow direct changes
        return common_1.shallowCopyAll(this._tokens);
    }
    // ---------------------- Subgraph initializer ----------------------
    static async initFromRealPool(poolId, query = false, blockNumber, testnet) {
        const pool = await index_1.getPool(poolId, blockNumber, testnet);
        if (!pool) {
            throw new Error("Could not fetch pool data");
        }
        if (pool.poolType !== "Weighted") {
            throw new Error("Pool must be weighted");
        }
        const id = pool.id;
        const address = pool.address;
        const bptTotalSupply = pool.totalShares;
        const swapFeePercentage = pool.swapFee;
        const tokens = [];
        for (const token of pool.tokens) {
            tokens.push({
                address: token.address,
                symbol: token.symbol,
                balance: token.balance,
                decimals: token.decimals,
                weight: token.weight,
            });
        }
        return new WeightedPool({
            id,
            address,
            tokens,
            bptTotalSupply,
            swapFeePercentage,
            query,
        });
    }
    // ---------------------- Misc ----------------------
    getInvariant() {
        const invariant = math._calculateInvariant(this._tokens.map((t) => this._upScale(t.weight, 18)), this._tokens.map((t) => this._upScale(t.balance, t.decimals)));
        return invariant.toString();
    }
    // ---------------------- Swap actions ----------------------
    swapGivenIn(tokenInSymbol, tokenOutSymbol, amountIn) {
        const tokenIn = this._tokens.find((t) => t.symbol === tokenInSymbol);
        const tokenOut = this._tokens.find((t) => t.symbol === tokenOutSymbol);
        const scaledAmountOut = math._calcOutGivenIn(this._upScale(tokenIn.balance, tokenIn.decimals), this._upScale(tokenIn.weight, 18), this._upScale(tokenOut.balance, tokenOut.decimals), this._upScale(tokenOut.weight, 18), this._upScale(amountIn, tokenIn.decimals), this._upScale(this._swapFeePercentage, 18));
        const amountOut = this._downScaleDown(scaledAmountOut, tokenOut.decimals);
        // In-place balance updates
        if (!this._query) {
            tokenIn.balance = big_number_1.bn(tokenIn.balance).plus(amountIn).toString();
            tokenOut.balance = big_number_1.bn(tokenOut.balance).minus(amountOut).toString();
        }
        return amountOut.toString();
    }
    swapGivenOut(tokenInSymbol, tokenOutSymbol, amountOut) {
        const tokenIn = this._tokens.find((t) => t.symbol === tokenInSymbol);
        const tokenOut = this._tokens.find((t) => t.symbol === tokenOutSymbol);
        const scaledAmountIn = math._calcInGivenOut(this._upScale(tokenIn.balance, tokenIn.decimals), this._upScale(tokenIn.weight, 18), this._upScale(tokenOut.balance, tokenOut.decimals), this._upScale(tokenOut.weight, 18), this._upScale(amountOut, tokenOut.decimals), this._upScale(this._swapFeePercentage, 18));
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
        const scaledBptOut = math._calcBptOutGivenExactTokensIn(this._tokens.map((t) => this._upScale(t.balance, t.decimals)), this._tokens.map((t) => this._upScale(t.weight, 18)), this._tokens.map((t) => this._upScale(amountsIn[t.symbol], t.decimals)), this._upScale(this._bptTotalSupply, 18), this._upScale(this._swapFeePercentage, 18));
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
        const tokenIn = this._tokens.find((t) => t.symbol === tokenInSymbol);
        if (!tokenIn) {
            throw new Error("Invalid input");
        }
        const scaledAmountIn = math._calcTokenInGivenExactBptOut(this._upScale(tokenIn.balance, tokenIn.decimals), this._upScale(tokenIn.weight, 18), this._upScale(bptOut, 18), this._upScale(this._bptTotalSupply, 18), this._upScale(this._swapFeePercentage, 18));
        const amountIn = this._downScaleUp(scaledAmountIn, tokenIn.decimals);
        // In-place balance updates
        if (!this._query) {
            tokenIn.balance = big_number_1.bn(tokenIn.balance).plus(amountIn).toString();
            this._bptTotalSupply = big_number_1.bn(this._bptTotalSupply).plus(bptOut).toString();
        }
        return amountIn.toString();
    }
    exitExactBptInForTokenOut(tokenOutSymbol, bptIn) {
        const tokenOut = this._tokens.find((t) => t.symbol === tokenOutSymbol);
        if (!tokenOut) {
            throw new Error("Invalid input");
        }
        const scaledAmountOut = math._calcTokenOutGivenExactBptIn(this._upScale(tokenOut.balance, tokenOut.decimals), this._upScale(tokenOut.weight, 18), this._upScale(bptIn, 18), this._upScale(this._bptTotalSupply, 18), this._upScale(this._swapFeePercentage, 18));
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
        const scaledBptIn = math._calcBptInGivenExactTokensOut(this._tokens.map((t) => this._upScale(t.balance, t.decimals)), this._tokens.map((t) => this._upScale(t.weight, 18)), this._tokens.map((t) => this._upScale(amountsOut[t.symbol], t.decimals)), this._upScale(this._bptTotalSupply, 18), this._upScale(this._swapFeePercentage, 18));
        const bptIn = this._downScaleUp(scaledBptIn, 18);
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
exports.default = WeightedPool;
