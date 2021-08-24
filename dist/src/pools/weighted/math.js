"use strict";
// Ported from Solidity:
// https://github.com/balancer-labs/balancer-core-v2/blob/70843e6a61ad11208c1cfabf5cfe15be216ca8d3/pkg/pool-weighted/contracts/WeightedMath.sol
Object.defineProperty(exports, "__esModule", { value: true });
exports._calcBptInGivenExactTokenOut = exports._calcBptOutGivenExactTokenIn = exports._calcDueTokenProtocolSwapFeeAmount = exports._calcTokensOutGivenExactBptIn = exports._calcTokenOutGivenExactBptIn = exports._calcBptInGivenExactTokensOut = exports._calcTokenInGivenExactBptOut = exports._calcBptOutGivenExactTokensIn = exports._calcInGivenOut = exports._calcOutGivenIn = exports._calculateInvariant = void 0;
const big_number_1 = require("../../utils/big-number");
const fp = require("../../utils/math/fixed-point");
// Swap limits: amounts swapped may not be larger than this percentage of total balance
const MAX_IN_RATIO = big_number_1.bn("300000000000000000"); // 0.3e18
const MAX_OUT_RATIO = big_number_1.bn("300000000000000000"); // 0.3e18
// Invariant growth limit: non-proportional joins cannot cause the invariant to increase by more than this ratio
const MAX_INVARIANT_RATIO = big_number_1.bn("3000000000000000000"); // 3e18
// Invariant shrink limit: non-proportional exits cannot cause the invariant to decrease by less than this ratio
const MIN_INVARIANT_RATIO = big_number_1.bn("700000000000000000"); // 0.7e18
const _calculateInvariant = (normalizedWeights, balances) => {
    /*****************************************************************************************
    // invariant               _____                                                        //
    // wi = weight index i      | |      wi                                                 //
    // bi = balance index i     | |  bi ^   = i                                             //
    // i = invariant                                                                        //
    *****************************************************************************************/
    let invariant = fp.ONE;
    for (let i = 0; i < normalizedWeights.length; i++) {
        invariant = fp.mulDown(invariant, fp.powDown(balances[i], normalizedWeights[i]));
    }
    if (invariant.lte(fp.ZERO)) {
        throw new Error("ZERO_INVARIANT");
    }
    return invariant;
};
exports._calculateInvariant = _calculateInvariant;
// Computes how many tokens can be taken out of a pool if `amountIn` is sent, given the
// current balances and weights.
const _calcOutGivenIn = (balanceIn, weightIn, balanceOut, weightOut, amountIn, swapFeePercentage) => {
    /*****************************************************************************************
    // outGivenIn                                                                           //
    // ao = amountOut                                                                       //
    // bo = balanceOut                                                                      //
    // bi = balanceIn              /      /            bi             \    (wi / wo) \      //
    // ai = amountIn    ao = bo * |  1 - | --------------------------  | ^            |     //
    // wi = weightIn               \      \       ( bi + ai )         /              /      //
    // wo = weightOut                                                                       //
    *****************************************************************************************/
    // Subtract the fee from the amount in if requested
    if (swapFeePercentage) {
        amountIn = fp.sub(amountIn, fp.mulUp(amountIn, swapFeePercentage));
    }
    // Amount out, so we round down overall
    // The multiplication rounds down, and the subtrahend (power) rounds up (so the base rounds up too)
    // Because bi / (bi + ai) <= 1, the exponent rounds down
    // Cannot exceed maximum in ratio
    if (amountIn.gt(fp.mulDown(balanceIn, MAX_IN_RATIO))) {
        throw new Error("MAX_IN_RATIO");
    }
    const denominator = fp.add(balanceIn, amountIn);
    const base = fp.divUp(balanceIn, denominator);
    const exponent = fp.divDown(weightIn, weightOut);
    const power = fp.powUp(base, exponent);
    return fp.mulDown(balanceOut, fp.complement(power));
};
exports._calcOutGivenIn = _calcOutGivenIn;
// Computes how many tokens must be sent to a pool in order to take `amountOut`, given the
// current balances and weights.
const _calcInGivenOut = (balanceIn, weightIn, balanceOut, weightOut, amountOut, swapFeePercentage) => {
    /*****************************************************************************************
    // inGivenOut                                                                           //
    // ao = amountOut                                                                       //
    // bo = balanceOut                                                                      //
    // bi = balanceIn              /  /            bo             \    (wo / wi)      \     //
    // ai = amountIn    ai = bi * |  | --------------------------  | ^            - 1  |    //
    // wi = weightIn               \  \       ( bo - ao )         /                   /     //
    // wo = weightOut                                                                       //
    *****************************************************************************************/
    // Amount in, so we round up overall
    // The multiplication rounds up, and the power rounds up (so the base rounds up too)
    // Because bo / (bo - ao) >= 1, the exponent rounds up
    // Cannot exceed maximum out ratio
    if (amountOut.gt(fp.mulDown(balanceOut, MAX_OUT_RATIO))) {
        throw new Error("MAX_OUT_RATIO");
    }
    const base = fp.divUp(balanceOut, fp.sub(balanceOut, amountOut));
    const exponent = fp.divUp(weightOut, weightIn);
    const power = fp.powUp(base, exponent);
    const ratio = fp.sub(power, fp.ONE);
    let amountIn = fp.mulUp(balanceIn, ratio);
    // Add the fee to the amount in if requested
    if (swapFeePercentage) {
        amountIn = fp.divUp(amountIn, fp.complement(swapFeePercentage));
    }
    return amountIn;
};
exports._calcInGivenOut = _calcInGivenOut;
const _calcBptOutGivenExactTokensIn = (balances, normalizedWeights, amountsIn, bptTotalSupply, swapFee) => {
    // BPT out, so we round down overall
    const balanceRatiosWithFee = new Array(amountsIn.length);
    let invariantRatioWithFees = fp.ZERO;
    for (let i = 0; i < balances.length; i++) {
        balanceRatiosWithFee[i] = fp.divDown(fp.add(balances[i], amountsIn[i]), balances[i]);
        invariantRatioWithFees = fp.add(invariantRatioWithFees, fp.mulDown(balanceRatiosWithFee[i], normalizedWeights[i]));
    }
    let invariantRatio = fp.ONE;
    for (let i = 0; i < balances.length; i++) {
        let amountInWithoutFee;
        if (balanceRatiosWithFee[i].gt(invariantRatioWithFees)) {
            const nonTaxableAmount = fp.mulDown(balances[i], fp.sub(invariantRatioWithFees, fp.ONE));
            const taxableAmount = fp.sub(amountsIn[i], nonTaxableAmount);
            amountInWithoutFee = fp.add(nonTaxableAmount, fp.mulDown(taxableAmount, fp.sub(fp.ONE, swapFee)));
        }
        else {
            amountInWithoutFee = amountsIn[i];
        }
        const balanceRatio = fp.divDown(fp.add(balances[i], amountInWithoutFee), balances[i]);
        invariantRatio = fp.mulDown(invariantRatio, fp.powDown(balanceRatio, normalizedWeights[i]));
    }
    if (invariantRatio.gte(fp.ONE)) {
        return fp.mulDown(bptTotalSupply, fp.sub(invariantRatio, fp.ONE));
    }
    else {
        return fp.ZERO;
    }
};
exports._calcBptOutGivenExactTokensIn = _calcBptOutGivenExactTokensIn;
const _calcTokenInGivenExactBptOut = (balance, normalizedWeight, bptAmountOut, bptTotalSupply, swapFee) => {
    /*****************************************************************************************
    // tokenInForExactBptOut                                                                //
    // a = amountIn                                                                         //
    // b = balance                      /  /     bpt + bptOut     \    (1 / w)      \       //
    // bptOut = bptAmountOut   a = b * |  | ---------------------- | ^          - 1  |      //
    // bpt = bptTotalSupply             \  \         bpt          /                 /       //
    // w = normalizedWeight                                                                 //
    *****************************************************************************************/
    // Token in, so we round up overall
    // Calculate the factor by which the invariant will increase after minting `bptAmountOut`
    const invariantRatio = fp.divUp(fp.add(bptTotalSupply, bptAmountOut), bptTotalSupply);
    if (invariantRatio.gt(MAX_INVARIANT_RATIO)) {
        throw new Error("MAX_OUT_BPT_FOR_TOKEN_IN");
    }
    // Calculate by how much the token balance has to increase to cause `invariantRatio`
    const balanceRatio = fp.powUp(invariantRatio, fp.divUp(fp.ONE, normalizedWeight));
    const amountInWithoutFee = fp.mulUp(balance, fp.sub(balanceRatio, fp.ONE));
    // We can now compute how much extra balance is being deposited and used in virtual swaps, and charge swap fees accordingly
    const taxablePercentage = fp.complement(normalizedWeight);
    const taxableAmount = fp.mulUp(amountInWithoutFee, taxablePercentage);
    const nonTaxableAmount = fp.sub(amountInWithoutFee, taxableAmount);
    return fp.add(nonTaxableAmount, fp.divUp(taxableAmount, fp.complement(swapFee)));
};
exports._calcTokenInGivenExactBptOut = _calcTokenInGivenExactBptOut;
const _calcBptInGivenExactTokensOut = (balances, normalizedWeights, amountsOut, bptTotalSupply, swapFee) => {
    // BPT in, so we round up overall
    const balanceRatiosWithoutFee = new Array(amountsOut.length);
    let invariantRatioWithoutFees = fp.ZERO;
    for (let i = 0; i < balances.length; i++) {
        balanceRatiosWithoutFee[i] = fp.divUp(fp.sub(balances[i], amountsOut[i]), balances[i]);
        invariantRatioWithoutFees = fp.add(invariantRatioWithoutFees, fp.mulUp(balanceRatiosWithoutFee[i], normalizedWeights[i]));
    }
    let invariantRatio = fp.ONE;
    for (let i = 0; i < balances.length; i++) {
        // Swap fees are typically charged on 'tokenIn', but there is no 'tokenIn' here, so we apply it to
        // 'tokenOut' - this results in slightly larger price impact
        let amountOutWithFee;
        if (invariantRatioWithoutFees.gt(balanceRatiosWithoutFee[i])) {
            const nonTaxableAmount = fp.mulDown(balances[i], fp.complement(invariantRatioWithoutFees));
            const taxableAmount = fp.sub(amountsOut[i], nonTaxableAmount);
            amountOutWithFee = fp.add(nonTaxableAmount, fp.divUp(taxableAmount, fp.complement(swapFee)));
        }
        else {
            amountOutWithFee = amountsOut[i];
        }
        const balanceRatio = fp.divDown(fp.sub(balances[i], amountOutWithFee), balances[i]);
        invariantRatio = fp.mulDown(invariantRatio, fp.powDown(balanceRatio, normalizedWeights[i]));
    }
    return fp.mulUp(bptTotalSupply, fp.complement(invariantRatio));
};
exports._calcBptInGivenExactTokensOut = _calcBptInGivenExactTokensOut;
const _calcTokenOutGivenExactBptIn = (balance, normalizedWeight, bptAmountIn, bptTotalSupply, swapFee) => {
    /*****************************************************************************************
    // exactBptInForTokenOut                                                                //
    // a = amountOut                                                                        //
    // b = balance                     /      /    bpt - bptIn    \    (1 / w)  \           //
    // bptIn = bptAmountIn    a = b * |  1 - | ------------------- | ^           |          //
    // bpt = bptTotalSupply            \      \        bpt        /             /           //
    // w = weight                                                                           //
    *****************************************************************************************/
    // Token out, so we round down overall
    // The multiplication rounds down, but the power rounds up (so the base rounds up)
    // Because (bpt - bptIn) / bpt <= 1, the exponent rounds down
    // Calculate the factor by which the invariant will decrease after burning `bptAmountIn`
    const invariantRatio = fp.divUp(fp.sub(bptTotalSupply, bptAmountIn), bptTotalSupply);
    if (invariantRatio.lt(MIN_INVARIANT_RATIO)) {
        throw new Error("MIN_BPT_IN_FOR_TOKEN_OUT");
    }
    // Calculate by how much the token balance has to increase to cause `invariantRatio`
    const balanceRatio = fp.powUp(invariantRatio, fp.divDown(fp.ONE, normalizedWeight));
    // Because of rounding up, `balanceRatio` can be greater than one, so we use its complement
    const amountOutWithoutFee = fp.mulDown(balance, fp.complement(balanceRatio));
    // We can now compute how much excess balance is being withdrawn as a result of the virtual swaps,
    // which result in swap fees
    const taxablePercentage = fp.complement(normalizedWeight);
    // Swap fees are typically charged on 'tokenIn', but there is no 'tokenIn' here, so we apply it
    // to 'tokenOut' - this results in slightly larger price impact (fees are rounded up)
    const taxableAmount = fp.mulUp(amountOutWithoutFee, taxablePercentage);
    const nonTaxableAmount = fp.sub(amountOutWithoutFee, taxableAmount);
    return fp.add(nonTaxableAmount, fp.mulDown(taxableAmount, fp.complement(swapFee)));
};
exports._calcTokenOutGivenExactBptIn = _calcTokenOutGivenExactBptIn;
const _calcTokensOutGivenExactBptIn = (balances, bptAmountIn, bptTotalSupply) => {
    /*****************************************************************************************
    // exactBptInForTokensOut                                                               //
    // (formula per token)                                                                  //
    // ao = amountOut                  /   bptIn   \                                        //
    // b = balance           ao = b * | ----------- |                                       //
    // bptIn = bptAmountIn             \    bpt    /                                        //
    // bpt = bptTotalSupply                                                                 //
    *****************************************************************************************/
    // Token out, so we round down overall
    // This means rounding down on both multiplication and division
    const bptRatio = fp.divDown(bptAmountIn, bptTotalSupply);
    const amountsOut = new Array(balances.length);
    for (let i = 0; i < balances.length; i++) {
        amountsOut[i] = fp.mulDown(balances[i], bptRatio);
    }
    return amountsOut;
};
exports._calcTokensOutGivenExactBptIn = _calcTokensOutGivenExactBptIn;
const _calcDueTokenProtocolSwapFeeAmount = (balance, normalizedWeight, previousInvariant, currentInvariant, protocolSwapFeePercentage) => {
    /*********************************************************************************
    /*  protocolSwapFeePercentage * balanceToken * ( 1 - (previousInvariant / currentInvariant) ^ (1 / weightToken))
    *********************************************************************************/
    if (currentInvariant.lte(previousInvariant)) {
        // This shouldn't happen outside of rounding errors, but have this safeguard nonetheless to prevent the Pool
        // from entering a locked state in which joins and exits revert while computing accumulated swap fees.
        return fp.ZERO;
    }
    // We round down to prevent issues in the Pool's accounting, even if it means paying slightly less in protocol
    // fees to the Vault.
    // Fee percentage and balance multiplications round down, while the subtrahend (power) rounds up (as does the
    // base). Because previousInvariant / currentInvariant <= 1, the exponent rounds down.
    let base = fp.divUp(previousInvariant, currentInvariant);
    const exponent = fp.divDown(fp.ONE, normalizedWeight);
    // Because the exponent is larger than one, the base of the power function has a lower bound. We cap to this
    // value to avoid numeric issues, which means in the extreme case (where the invariant growth is larger than
    // 1 / min exponent) the Pool will pay less in protocol fees than it should.
    base = base.gte(fp.MIN_POW_BASE_FREE_EXPONENT)
        ? base
        : fp.MIN_POW_BASE_FREE_EXPONENT;
    const power = fp.powUp(base, exponent);
    const tokenAccruedFees = fp.mulDown(balance, fp.complement(power));
    return fp.mulDown(tokenAccruedFees, protocolSwapFeePercentage);
};
exports._calcDueTokenProtocolSwapFeeAmount = _calcDueTokenProtocolSwapFeeAmount;
// Convenience method needed by the SOR package (adapted from _calcBptOutGivenExactTokensIn)
const _calcBptOutGivenExactTokenIn = (balance, normalizedWeight, amountIn, bptTotalSupply, swapFee) => {
    // BPT out, so we round down overall
    const tokenBalanceRatioWithoutFee = fp.divDown(fp.add(balance, amountIn), balance);
    const weightedBalanceRatio = fp.mulDown(tokenBalanceRatioWithoutFee, normalizedWeight);
    let invariantRatio = fp.ONE;
    // Percentage of the amount supplied that will be swapped for other tokens in the pool
    let tokenBalancePercentageExcess;
    // Some tokens might have amounts supplied in excess of a 'balanced' join: these are identified if
    // the token's balance ratio sans fee is larger than the weighted balance ratio, and swap fees charged
    // on the amount to swap
    if (weightedBalanceRatio.gte(tokenBalanceRatioWithoutFee)) {
        tokenBalancePercentageExcess = fp.ZERO;
    }
    else {
        tokenBalancePercentageExcess = fp.divUp(fp.sub(tokenBalanceRatioWithoutFee, weightedBalanceRatio), fp.sub(tokenBalanceRatioWithoutFee, fp.ONE));
    }
    const swapFeeExcess = fp.mulUp(swapFee, tokenBalancePercentageExcess);
    const amountInAfterFee = fp.mulDown(amountIn, fp.complement(swapFeeExcess));
    const tokenBalanceRatio = fp.add(fp.ONE, fp.divDown(amountInAfterFee, balance));
    invariantRatio = fp.mulDown(invariantRatio, fp.powDown(tokenBalanceRatio, normalizedWeight));
    return fp.mulDown(bptTotalSupply, fp.sub(invariantRatio, fp.ONE));
};
exports._calcBptOutGivenExactTokenIn = _calcBptOutGivenExactTokenIn;
// Convenience method needed by the SOR package (adapted from _calcBptInGivenExactTokensOut)
function _calcBptInGivenExactTokenOut(balance, normalizedWeight, amountOut, bptTotalSupply, swapFee) {
    // BPT in, so we round up overall
    const tokenBalanceRatioWithoutFee = fp.divUp(fp.sub(balance, amountOut), balance);
    const weightedBalanceRatio = fp.mulUp(tokenBalanceRatioWithoutFee, normalizedWeight);
    let invariantRatio = fp.ONE;
    // Percentage of the amount supplied that will be swapped for other tokens in the pool
    let tokenBalancePercentageExcess;
    // For each ratioSansFee, compare with the total weighted ratio (weightedBalanceRatio) and
    // decrease the fee from what goes above it
    if (weightedBalanceRatio.lte(tokenBalanceRatioWithoutFee)) {
        tokenBalancePercentageExcess = fp.ZERO;
    }
    else {
        tokenBalancePercentageExcess = fp.divUp(fp.sub(weightedBalanceRatio, tokenBalanceRatioWithoutFee), fp.complement(tokenBalanceRatioWithoutFee));
    }
    const swapFeeExcess = fp.mulUp(swapFee, tokenBalancePercentageExcess);
    const amountOutBeforeFee = fp.divUp(amountOut, fp.complement(swapFeeExcess));
    const tokenBalanceRatio = fp.complement(fp.divUp(amountOutBeforeFee, balance));
    invariantRatio = fp.mulDown(invariantRatio, fp.powDown(tokenBalanceRatio, normalizedWeight));
    return fp.mulUp(bptTotalSupply, fp.complement(invariantRatio));
}
exports._calcBptInGivenExactTokenOut = _calcBptInGivenExactTokenOut;
