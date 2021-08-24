"use strict";
// Ported from Solidity:
// https://github.com/balancer-labs/balancer-core-v2/blob/70843e6a61ad11208c1cfabf5cfe15be216ca8d3/pkg/pool-stable/contracts/StableMath.sol
Object.defineProperty(exports, "__esModule", { value: true });
exports._calcDueTokenProtocolSwapFeeAmount = exports._calcTokensOutGivenExactBptIn = exports._calcTokenOutGivenExactBptIn = exports._calcBptInGivenExactTokensOut = exports._calcTokenInGivenExactBptOut = exports._calcBptOutGivenExactTokensIn = exports._calcInGivenOut = exports._calcOutGivenIn = exports._calculateInvariant = exports.MAX_STABLE_TOKENS = exports.AMP_PRECISION = exports.MAX_AMP = exports.MIN_AMP = void 0;
const big_number_1 = require("../../utils/big-number");
const fp = require("../../utils/math/fixed-point");
const math = require("../../utils/math/math");
exports.MIN_AMP = big_number_1.bn(1);
exports.MAX_AMP = big_number_1.bn(5000);
exports.AMP_PRECISION = big_number_1.bn(1000);
exports.MAX_STABLE_TOKENS = 5;
// Computes the invariant given the current balances, using the Newton-Raphson approximation.
// The amplification parameter equals: A n^(n-1)
const _calculateInvariant = (amplificationParameter, balances, roundUp) => {
    /**********************************************************************************************
    // invariant                                                                                 //
    // D = invariant                                                  D^(n+1)                    //
    // A = amplification coefficient      A  n^n S + D = A D n^n + -----------                   //
    // S = sum of balances                                             n^n P                     //
    // P = product of balances                                                                   //
    // n = number of tokens                                                                      //
    **********************************************************************************************/
    // We support rounding up or down.
    let sum = math.ZERO;
    let numTokens = big_number_1.bn(balances.length);
    for (let i = 0; i < balances.length; i++) {
        sum = fp.add(sum, balances[i]);
    }
    if (sum.isZero()) {
        return math.ZERO;
    }
    let prevInvariant = math.ZERO;
    let invariant = sum;
    let ampTimesTotal = math.mul(amplificationParameter, numTokens);
    for (let i = 0; i < 255; i++) {
        let P_D = math.mul(numTokens, balances[0]);
        for (let j = 1; j < balances.length; j++) {
            P_D = math.div(math.mul(math.mul(P_D, balances[j]), numTokens), invariant, roundUp);
        }
        prevInvariant = invariant;
        invariant = math.div(fp.add(math.mul(math.mul(numTokens, invariant), invariant), math.div(math.mul(math.mul(ampTimesTotal, sum), P_D), exports.AMP_PRECISION, roundUp)), fp.add(math.mul(fp.add(numTokens, math.ONE), invariant), math.div(math.mul(fp.sub(ampTimesTotal, exports.AMP_PRECISION), P_D), exports.AMP_PRECISION, !roundUp)), roundUp);
        if (invariant.gt(prevInvariant)) {
            if (fp.sub(invariant, prevInvariant).lte(math.ONE)) {
                return invariant;
            }
        }
        else if (fp.sub(prevInvariant, invariant).lte(math.ONE)) {
            return invariant;
        }
    }
    throw new Error("STABLE_GET_BALANCE_DIDNT_CONVERGE");
};
exports._calculateInvariant = _calculateInvariant;
// Computes how many tokens can be taken out of a pool if `tokenAmountIn` are sent, given the current balances.
// The amplification parameter equals: A n^(n-1)
const _calcOutGivenIn = (amplificationParameter, balances, tokenIndexIn, tokenIndexOut, tokenAmountIn, swapFeePercentage) => {
    /**************************************************************************************************************
    // outGivenIn token x for y - polynomial equation to solve                                                   //
    // ay = amount out to calculate                                                                              //
    // by = balance token out                                                                                    //
    // y = by - ay (finalBalanceOut)                                                                             //
    // D = invariant                                               D                     D^(n+1)                 //
    // A = amplification coefficient               y^2 + ( S - ----------  - D) * y -  ------------- = 0         //
    // n = number of tokens                                    (A * n^n)               A * n^2n * P              //
    // S = sum of final balances but y                                                                           //
    // P = product of final balances but y                                                                       //
    **************************************************************************************************************/
    // Subtract the fee from the amount in if requested
    if (swapFeePercentage) {
        tokenAmountIn = fp.sub(tokenAmountIn, fp.mulUp(tokenAmountIn, swapFeePercentage));
    }
    // Amount out, so we round down overall.
    // Given that we need to have a greater final balance out, the invariant needs to be rounded up
    const invariant = exports._calculateInvariant(amplificationParameter, balances, true);
    balances[tokenIndexIn] = fp.add(balances[tokenIndexIn], tokenAmountIn);
    const finalBalanceOut = _getTokenBalanceGivenInvariantAndAllOtherBalances(amplificationParameter, balances, invariant, tokenIndexOut);
    balances[tokenIndexIn] = fp.sub(balances[tokenIndexIn], tokenAmountIn);
    return fp.sub(fp.sub(balances[tokenIndexOut], finalBalanceOut), math.ONE);
};
exports._calcOutGivenIn = _calcOutGivenIn;
// Computes how many tokens must be sent to a pool if `tokenAmountOut` are sent given the
// current balances, using the Newton-Raphson approximation.
// The amplification parameter equals: A n^(n-1)
const _calcInGivenOut = (amplificationParameter, balances, tokenIndexIn, tokenIndexOut, tokenAmountOut, swapFeePercentage) => {
    /**************************************************************************************************************
    // inGivenOut token x for y - polynomial equation to solve                                                   //
    // ax = amount in to calculate                                                                               //
    // bx = balance token in                                                                                     //
    // x = bx + ax (finalBalanceIn)                                                                              //
    // D = invariant                                                D                     D^(n+1)                //
    // A = amplification coefficient               x^2 + ( S - ----------  - D) * x -  ------------- = 0         //
    // n = number of tokens                                     (A * n^n)               A * n^2n * P             //
    // S = sum of final balances but x                                                                           //
    // P = product of final balances but x                                                                       //
    **************************************************************************************************************/
    // Amount in, so we round up overall.
    // Given that we need to have a greater final balance in, the invariant needs to be rounded up
    const invariant = exports._calculateInvariant(amplificationParameter, balances, true);
    balances[tokenIndexOut] = fp.sub(balances[tokenIndexOut], tokenAmountOut);
    const finalBalanceIn = _getTokenBalanceGivenInvariantAndAllOtherBalances(amplificationParameter, balances, invariant, tokenIndexIn);
    balances[tokenIndexOut] = fp.add(balances[tokenIndexOut], tokenAmountOut);
    let amountIn = fp.add(fp.sub(finalBalanceIn, balances[tokenIndexIn]), math.ONE);
    // Add the fee to the amount in if requested
    if (swapFeePercentage) {
        amountIn = fp.divUp(amountIn, fp.complement(swapFeePercentage));
    }
    return amountIn;
};
exports._calcInGivenOut = _calcInGivenOut;
const _calcBptOutGivenExactTokensIn = (amp, balances, amountsIn, bptTotalSupply, swapFeePercentage) => {
    // BPT out, so we round down overall.
    // First loop calculates the sum of all token balances, which will be used to calculate
    // the current weights of each token, relative to this sum
    let sumBalances = math.ZERO;
    for (let i = 0; i < balances.length; i++) {
        sumBalances = fp.add(sumBalances, balances[i]);
    }
    // Calculate the weighted balance ratio without considering fees
    const balanceRatiosWithFee = new Array(amountsIn.length);
    // The weighted sum of token balance ratios without fee
    let invariantRatioWithFees = math.ZERO;
    for (let i = 0; i < balances.length; i++) {
        const currentWeight = fp.divDown(balances[i], sumBalances);
        balanceRatiosWithFee[i] = fp.divDown(fp.add(balances[i], amountsIn[i]), balances[i]);
        invariantRatioWithFees = fp.add(invariantRatioWithFees, fp.mulDown(balanceRatiosWithFee[i], currentWeight));
    }
    // Second loop calculates new amounts in, taking into account the fee on the percentage excess
    const newBalances = new Array(balances.length);
    for (let i = 0; i < balances.length; i++) {
        let amountInWithoutFee;
        // Check if the balance ratio is greater than the ideal ratio to charge fees or not
        if (balanceRatiosWithFee[i].gt(invariantRatioWithFees)) {
            const nonTaxableAmount = fp.mulDown(balances[i], fp.sub(invariantRatioWithFees, fp.ONE));
            const taxableAmount = fp.sub(amountsIn[i], nonTaxableAmount);
            amountInWithoutFee = fp.add(nonTaxableAmount, fp.mulDown(taxableAmount, fp.sub(fp.ONE, swapFeePercentage)));
        }
        else {
            amountInWithoutFee = amountsIn[i];
        }
        newBalances[i] = fp.add(balances[i], amountInWithoutFee);
    }
    // Get current and new invariants, taking swap fees into account
    const currentInvariant = exports._calculateInvariant(amp, balances, true);
    const newInvariant = exports._calculateInvariant(amp, newBalances, false);
    const invariantRatio = fp.divDown(newInvariant, currentInvariant);
    // If the invariant didn't increase for any reason, we simply don't mint BPT
    if (invariantRatio.gt(fp.ONE)) {
        return fp.mulDown(bptTotalSupply, fp.sub(invariantRatio, fp.ONE));
    }
    else {
        return math.ZERO;
    }
};
exports._calcBptOutGivenExactTokensIn = _calcBptOutGivenExactTokensIn;
const _calcTokenInGivenExactBptOut = (amp, balances, tokenIndex, bptAmountOut, bptTotalSupply, swapFeePercentage) => {
    // Token in, so we round up overall.
    // Get the current invariant
    const currentInvariant = exports._calculateInvariant(amp, balances, true);
    // Calculate new invariant
    const newInvariant = fp.mulUp(fp.divUp(fp.add(bptTotalSupply, bptAmountOut), bptTotalSupply), currentInvariant);
    // Calculate amount in without fee.
    const newBalanceTokenIndex = _getTokenBalanceGivenInvariantAndAllOtherBalances(amp, balances, newInvariant, tokenIndex);
    const amountInWithoutFee = fp.sub(newBalanceTokenIndex, balances[tokenIndex]);
    // First calculate the sum of all token balances, which will be used to calculate
    // the current weight of each token
    let sumBalances = math.ZERO;
    for (let i = 0; i < balances.length; i++) {
        sumBalances = fp.add(sumBalances, balances[i]);
    }
    // We can now compute how much extra balance is being deposited and used in virtual swaps, and charge swap fees
    // accordingly.
    const currentWeight = fp.divDown(balances[tokenIndex], sumBalances);
    const taxablePercentage = fp.complement(currentWeight);
    const taxableAmount = fp.mulUp(amountInWithoutFee, taxablePercentage);
    const nonTaxableAmount = fp.sub(amountInWithoutFee, taxableAmount);
    return fp.add(nonTaxableAmount, fp.divUp(taxableAmount, fp.sub(fp.ONE, swapFeePercentage)));
};
exports._calcTokenInGivenExactBptOut = _calcTokenInGivenExactBptOut;
/*
  Flow of calculations:
  amountsTokenOut -> amountsOutProportional ->
  amountOutPercentageExcess -> amountOutBeforeFee -> newInvariant -> amountBPTIn
*/
const _calcBptInGivenExactTokensOut = (amp, balances, amountsOut, bptTotalSupply, swapFeePercentage) => {
    // BPT in, so we round up overall.
    // First loop calculates the sum of all token balances, which will be used to calculate
    // the current weights of each token relative to this sum
    let sumBalances = math.ZERO;
    for (let i = 0; i < balances.length; i++) {
        sumBalances = fp.add(sumBalances, balances[i]);
    }
    // Calculate the weighted balance ratio without considering fees
    const balanceRatiosWithoutFee = new Array(amountsOut.length);
    let invariantRatioWithoutFees = math.ZERO;
    for (let i = 0; i < balances.length; i++) {
        const currentWeight = fp.divUp(balances[i], sumBalances);
        balanceRatiosWithoutFee[i] = fp.divUp(fp.sub(balances[i], amountsOut[i]), balances[i]);
        invariantRatioWithoutFees = fp.add(invariantRatioWithoutFees, fp.mulUp(balanceRatiosWithoutFee[i], currentWeight));
    }
    // Second loop calculates new amounts in, taking into account the fee on the percentage excess
    const newBalances = new Array(balances.length);
    for (let i = 0; i < balances.length; i++) {
        // Swap fees are typically charged on 'token in', but there is no 'token in' here, so we apply it to
        // 'token out'. This results in slightly larger price impact.
        let amountOutWithFee;
        if (invariantRatioWithoutFees.gt(balanceRatiosWithoutFee[i])) {
            const nonTaxableAmount = fp.mulDown(balances[i], fp.complement(invariantRatioWithoutFees));
            const taxableAmount = fp.sub(amountsOut[i], nonTaxableAmount);
            amountOutWithFee = fp.add(nonTaxableAmount, fp.divUp(taxableAmount, fp.sub(fp.ONE, swapFeePercentage)));
        }
        else {
            amountOutWithFee = amountsOut[i];
        }
        newBalances[i] = fp.sub(balances[i], amountOutWithFee);
    }
    // Get current and new invariants, taking into account swap fees
    const currentInvariant = exports._calculateInvariant(amp, balances, true);
    const newInvariant = exports._calculateInvariant(amp, newBalances, false);
    const invariantRatio = fp.divDown(newInvariant, currentInvariant);
    // return amountBPTIn
    return fp.mulUp(bptTotalSupply, fp.complement(invariantRatio));
};
exports._calcBptInGivenExactTokensOut = _calcBptInGivenExactTokensOut;
const _calcTokenOutGivenExactBptIn = (amp, balances, tokenIndex, bptAmountIn, bptTotalSupply, swapFeePercentage) => {
    // Token out, so we round down overall.
    // Get the current and new invariants. Since we need a bigger new invariant, we round the current one up.
    const currentInvariant = exports._calculateInvariant(amp, balances, true);
    const newInvariant = fp.mulUp(fp.divUp(fp.sub(bptTotalSupply, bptAmountIn), bptTotalSupply), currentInvariant);
    // Calculate amount out without fee
    const newBalanceTokenIndex = _getTokenBalanceGivenInvariantAndAllOtherBalances(amp, balances, newInvariant, tokenIndex);
    const amountOutWithoutFee = fp.sub(balances[tokenIndex], newBalanceTokenIndex);
    // First calculate the sum of all token balances, which will be used to calculate
    // the current weight of each token
    let sumBalances = math.ZERO;
    for (let i = 0; i < balances.length; i++) {
        sumBalances = fp.add(sumBalances, balances[i]);
    }
    // We can now compute how much excess balance is being withdrawn as a result of the virtual swaps, which result
    // in swap fees.
    const currentWeight = fp.divDown(balances[tokenIndex], sumBalances);
    const taxablePercentage = fp.complement(currentWeight);
    // Swap fees are typically charged on 'token in', but there is no 'token in' here, so we apply it
    // to 'token out'. This results in slightly larger price impact. Fees are rounded up.
    const taxableAmount = fp.mulUp(amountOutWithoutFee, taxablePercentage);
    const nonTaxableAmount = fp.sub(amountOutWithoutFee, taxableAmount);
    return fp.add(nonTaxableAmount, fp.mulDown(taxableAmount, fp.sub(fp.ONE, swapFeePercentage)));
};
exports._calcTokenOutGivenExactBptIn = _calcTokenOutGivenExactBptIn;
const _calcTokensOutGivenExactBptIn = (balances, bptAmountIn, bptTotalSupply) => {
    /**********************************************************************************************
    // exactBPTInForTokensOut                                                                    //
    // (per token)                                                                               //
    // aO = tokenAmountOut             /        bptIn         \                                  //
    // b = tokenBalance      a0 = b * | ---------------------  |                                 //
    // bptIn = bptAmountIn             \     bptTotalSupply    /                                 //
    // bpt = bptTotalSupply                                                                      //
    **********************************************************************************************/
    // Since we're computing an amount out, we round down overall. This means rounding down on both the
    // multiplication and division.
    const bptRatio = fp.divDown(bptAmountIn, bptTotalSupply);
    const amountsOut = new Array(balances.length);
    for (let i = 0; i < balances.length; i++) {
        amountsOut[i] = fp.mulDown(balances[i], bptRatio);
    }
    return amountsOut;
};
exports._calcTokensOutGivenExactBptIn = _calcTokensOutGivenExactBptIn;
// The amplification parameter equals: A n^(n-1)
const _calcDueTokenProtocolSwapFeeAmount = (amplificationParameter, balances, lastInvariant, tokenIndex, protocolSwapFeePercentage) => {
    /**************************************************************************************************************
    // oneTokenSwapFee - polynomial equation to solve                                                            //
    // af = fee amount to calculate in one token                                                                 //
    // bf = balance of fee token                                                                                 //
    // f = bf - af (finalBalanceFeeToken)                                                                        //
    // D = old invariant                                            D                     D^(n+1)                //
    // A = amplification coefficient               f^2 + ( S - ----------  - D) * f -  ------------- = 0         //
    // n = number of tokens                                    (A * n^n)               A * n^2n * P              //
    // S = sum of final balances but f                                                                           //
    // P = product of final balances but f                                                                       //
    **************************************************************************************************************/
    // Protocol swap fee amount, so we round down overall.
    const finalBalanceFeeToken = _getTokenBalanceGivenInvariantAndAllOtherBalances(amplificationParameter, balances, lastInvariant, tokenIndex);
    if (balances[tokenIndex].lte(finalBalanceFeeToken)) {
        // This shouldn't happen outside of rounding errors, but have this safeguard nonetheless to prevent the Pool
        // from entering a locked state in which joins and exits revert while computing accumulated swap fees.
        return math.ZERO;
    }
    // Result is rounded down
    const accumulatedTokenSwapFees = fp.sub(balances[tokenIndex], finalBalanceFeeToken);
    return fp.divDown(fp.mulDown(accumulatedTokenSwapFees, protocolSwapFeePercentage), fp.ONE);
};
exports._calcDueTokenProtocolSwapFeeAmount = _calcDueTokenProtocolSwapFeeAmount;
// This function calculates the balance of a given token (tokenIndex)
// given all the other balances and the invariant
const _getTokenBalanceGivenInvariantAndAllOtherBalances = (amplificationParameter, balances, invariant, tokenIndex) => {
    // Rounds result up overall
    const numTokens = big_number_1.bn(balances.length);
    const ampTimesTotal = math.mul(amplificationParameter, numTokens);
    let sum = balances[0];
    let P_D = math.mul(numTokens, balances[0]);
    for (let j = 1; j < balances.length; j++) {
        P_D = math.divDown(math.mul(math.mul(P_D, balances[j]), numTokens), invariant);
        sum = fp.add(sum, balances[j]);
    }
    sum = fp.sub(sum, balances[tokenIndex]);
    const inv2 = math.mul(invariant, invariant);
    // We remove the balance fromm c by multiplying it
    const c = math.mul(math.mul(math.divUp(inv2, math.mul(ampTimesTotal, P_D)), exports.AMP_PRECISION), balances[tokenIndex]);
    const b = fp.add(sum, math.mul(math.divDown(invariant, ampTimesTotal), exports.AMP_PRECISION));
    // We iterate to find the balance
    let prevTokenBalance = math.ZERO;
    // We multiply the first iteration outside the loop with the invariant to set the value of the
    // initial approximation.
    let tokenBalance = math.divUp(fp.add(inv2, c), fp.add(invariant, b));
    for (let i = 0; i < 255; i++) {
        prevTokenBalance = tokenBalance;
        tokenBalance = math.divUp(fp.add(math.mul(tokenBalance, tokenBalance), c), fp.sub(fp.add(math.mul(tokenBalance, math.TWO), b), invariant));
        if (tokenBalance.gt(prevTokenBalance)) {
            if (fp.sub(tokenBalance, prevTokenBalance).lte(math.ONE)) {
                return tokenBalance;
            }
        }
        else if (fp.sub(prevTokenBalance, tokenBalance).lte(math.ONE)) {
            return tokenBalance;
        }
    }
    throw new Error("STABLE_GET_BALANCE_DIDNT_CONVERGE");
};
