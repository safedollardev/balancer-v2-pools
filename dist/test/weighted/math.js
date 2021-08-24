"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
const sdkWeightedMath = require("../../src/pools/weighted/math");
const big_number_1 = require("../../src/utils/big-number");
const test_1 = require("../../src/utils/test");
describe("WeightedMath", () => {
    let deployer;
    let evmWeightedMath;
    before(async () => {
        [deployer] = await hardhat_1.ethers.getSigners();
        evmWeightedMath = await test_1.deployContract({
            name: "WeightedMath",
            from: deployer,
        });
    });
    describe("_calculateInvariant", () => {
        let normalizedWeights;
        let balances;
        afterEach(async () => {
            const evmExecution = evmWeightedMath._calculateInvariant(big_number_1.scaleAll(normalizedWeights, 18).map(test_1.toEvmBn), big_number_1.scaleAll(balances, 18).map(test_1.toEvmBn));
            const sdkExecution = new Promise((resolve) => resolve(sdkWeightedMath._calculateInvariant(big_number_1.scaleAll(normalizedWeights, 18), big_number_1.scaleAll(balances, 18))));
            chai_1.expect(await test_1.isSameResult(sdkExecution, evmExecution)).to.be.true;
        });
        it("two tokens", () => {
            normalizedWeights = ["0.5", "0.5"];
            balances = ["1000", "1500"];
        });
        it("three tokens", () => {
            normalizedWeights = ["0.3", "0.3", "0.4"];
            balances = ["1000", "1000", "2000"];
        });
        it("empty invariant", () => {
            normalizedWeights = [];
            balances = [];
        });
    });
    describe("_calcOutGivenIn", () => {
        let balanceIn;
        let weightIn;
        let balanceOut;
        let weightOut;
        let amountIn;
        afterEach(async () => {
            const evmExecution = evmWeightedMath._calcOutGivenIn(test_1.toEvmBn(big_number_1.scale(balanceIn, 18)), test_1.toEvmBn(big_number_1.scale(weightIn, 18)), test_1.toEvmBn(big_number_1.scale(balanceOut, 18)), test_1.toEvmBn(big_number_1.scale(weightOut, 18)), test_1.toEvmBn(big_number_1.scale(amountIn, 18)));
            const sdkExecution = new Promise((resolve) => resolve(sdkWeightedMath._calcOutGivenIn(big_number_1.scale(balanceIn, 18), big_number_1.scale(weightIn, 18), big_number_1.scale(balanceOut, 18), big_number_1.scale(weightOut, 18), big_number_1.scale(amountIn, 18))));
            chai_1.expect(await test_1.isSameResult(sdkExecution, evmExecution)).to.be.true;
        });
        it("simple values", () => {
            balanceIn = "1000";
            weightIn = "0.4";
            balanceOut = "3000";
            weightOut = "0.6";
            amountIn = "10";
        });
        it("extreme balances", () => {
            balanceIn = "10000000";
            weightIn = "0.5";
            balanceOut = "1";
            weightOut = "0.5";
            amountIn = "10";
        });
        it("extreme weights", () => {
            balanceIn = "1000";
            weightIn = "0.001";
            balanceOut = "2000";
            weightOut = "0.999";
            amountIn = "10";
        });
    });
    describe("_calcInGivenOut", () => {
        let balanceIn;
        let weightIn;
        let balanceOut;
        let weightOut;
        let amountOut;
        afterEach(async () => {
            const evmExecution = evmWeightedMath._calcOutGivenIn(test_1.toEvmBn(big_number_1.scale(balanceIn, 18)), test_1.toEvmBn(big_number_1.scale(weightIn, 18)), test_1.toEvmBn(big_number_1.scale(balanceOut, 18)), test_1.toEvmBn(big_number_1.scale(weightOut, 18)), test_1.toEvmBn(big_number_1.scale(amountOut, 18)));
            const sdkExecution = new Promise((resolve) => resolve(sdkWeightedMath._calcOutGivenIn(big_number_1.scale(balanceIn, 18), big_number_1.scale(weightIn, 18), big_number_1.scale(balanceOut, 18), big_number_1.scale(weightOut, 18), big_number_1.scale(amountOut, 18))));
            chai_1.expect(await test_1.isSameResult(sdkExecution, evmExecution)).to.be.true;
        });
        it("simple values", () => {
            balanceIn = "100";
            weightIn = "0.2";
            balanceOut = "1000";
            weightOut = "0.8";
            amountOut = "100";
        });
        it("extreme balances", () => {
            balanceIn = "90000000";
            weightIn = "0.3";
            balanceOut = "0.1";
            weightOut = "0.7";
            amountOut = "0.01";
        });
        it("extreme weights", () => {
            balanceIn = "1000";
            weightIn = "0.999";
            balanceOut = "2000";
            weightOut = "0.001";
            amountOut = "500";
        });
    });
    describe("_calcBptOutGivenExactTokensIn", () => {
        let balances;
        let normalizedWeights;
        let amountsIn;
        let bptTotalSupply;
        let swapFee;
        afterEach(async () => {
            const evmExecution = evmWeightedMath._calcBptOutGivenExactTokensIn(big_number_1.scaleAll(balances, 18).map(test_1.toEvmBn), big_number_1.scaleAll(normalizedWeights, 18).map(test_1.toEvmBn), big_number_1.scaleAll(amountsIn, 18).map(test_1.toEvmBn), test_1.toEvmBn(big_number_1.scale(bptTotalSupply, 18)), test_1.toEvmBn(big_number_1.scale(swapFee, 18)));
            const sdkExecution = new Promise((resolve) => resolve(sdkWeightedMath._calcBptOutGivenExactTokensIn(big_number_1.scaleAll(balances, 18), big_number_1.scaleAll(normalizedWeights, 18), big_number_1.scaleAll(amountsIn, 18), big_number_1.scale(bptTotalSupply, 18), big_number_1.scale(swapFee, 18))));
            chai_1.expect(await test_1.isSameResult(sdkExecution, evmExecution)).to.be.true;
        });
        it("simple values", () => {
            balances = ["100", "200", "300"];
            normalizedWeights = ["0.2", "0.4", "0.4"];
            amountsIn = ["50", "100", "100"];
            bptTotalSupply = "1000";
            swapFee = "0.01";
        });
    });
    describe("_calcBptOutGivenExactTokenIn", () => {
        let balance;
        let normalizedWeight;
        let amountIn;
        let bptTotalSupply;
        let swapFee;
        afterEach(async () => {
            const evmExecution = evmWeightedMath._calcBptOutGivenExactTokensIn([test_1.toEvmBn(big_number_1.scale(balance, 18))], [test_1.toEvmBn(big_number_1.scale(normalizedWeight, 18))], [test_1.toEvmBn(big_number_1.scale(amountIn, 18))], test_1.toEvmBn(big_number_1.scale(bptTotalSupply, 18)), test_1.toEvmBn(big_number_1.scale(swapFee, 18)));
            const sdkExecution = new Promise((resolve) => resolve(sdkWeightedMath._calcBptOutGivenExactTokenIn(big_number_1.scale(balance, 18), big_number_1.scale(normalizedWeight, 18), big_number_1.scale(amountIn, 18), big_number_1.scale(bptTotalSupply, 18), big_number_1.scale(swapFee, 18))));
            chai_1.expect(await test_1.isSameResult(sdkExecution, evmExecution)).to.be.true;
        });
        it("simple values", () => {
            balance = "10000";
            normalizedWeight = "1";
            amountIn = "100";
            bptTotalSupply = "1000";
            swapFee = "0.01";
        });
    });
    describe("_calcTokenInGivenExactBptOut", () => {
        let balance;
        let normalizedWeight;
        let bptAmountOut;
        let bptTotalSupply;
        let swapFee;
        afterEach(async () => {
            const evmExecution = evmWeightedMath._calcTokenInGivenExactBptOut(test_1.toEvmBn(big_number_1.scale(balance, 18)), test_1.toEvmBn(big_number_1.scale(normalizedWeight, 18)), test_1.toEvmBn(big_number_1.scale(bptAmountOut, 18)), test_1.toEvmBn(big_number_1.scale(bptTotalSupply, 18)), test_1.toEvmBn(big_number_1.scale(swapFee, 18)));
            const sdkExecution = new Promise((resolve) => resolve(sdkWeightedMath._calcTokenInGivenExactBptOut(big_number_1.scale(balance, 18), big_number_1.scale(normalizedWeight, 18), big_number_1.scale(bptAmountOut, 18), big_number_1.scale(bptTotalSupply, 18), big_number_1.scale(swapFee, 18))));
            chai_1.expect(await test_1.isSameResult(sdkExecution, evmExecution)).to.be.true;
        });
        it("simple values", () => {
            balance = "1000";
            normalizedWeight = "0.6";
            bptAmountOut = "10";
            bptTotalSupply = "1000";
            swapFee = "0.01";
        });
    });
    describe("_calcBptInGivenExactTokensOut", () => {
        let balances;
        let normalizedWeights;
        let amountsOut;
        let bptTotalSupply;
        let swapFee;
        afterEach(async () => {
            const evmExecution = evmWeightedMath._calcBptInGivenExactTokensOut(big_number_1.scaleAll(balances, 18).map(test_1.toEvmBn), big_number_1.scaleAll(normalizedWeights, 18).map(test_1.toEvmBn), big_number_1.scaleAll(amountsOut, 18).map(test_1.toEvmBn), test_1.toEvmBn(big_number_1.scale(bptTotalSupply, 18)), test_1.toEvmBn(big_number_1.scale(swapFee, 18)));
            const sdkExecution = new Promise((resolve) => resolve(sdkWeightedMath._calcBptInGivenExactTokensOut(big_number_1.scaleAll(balances, 18), big_number_1.scaleAll(normalizedWeights, 18), big_number_1.scaleAll(amountsOut, 18), big_number_1.scale(bptTotalSupply, 18), big_number_1.scale(swapFee, 18))));
            chai_1.expect(await test_1.isSameResult(sdkExecution, evmExecution)).to.be.true;
        });
        it("simple values", () => {
            balances = ["100", "200", "300"];
            normalizedWeights = ["0.2", "0.4", "0.4"];
            amountsOut = ["50", "100", "100"];
            bptTotalSupply = "1000";
            swapFee = "0.01";
        });
    });
    describe("_calcBptInGivenExactTokenOut", () => {
        let balance;
        let normalizedWeight;
        let amountOut;
        let bptTotalSupply;
        let swapFee;
        afterEach(async () => {
            const evmExecution = evmWeightedMath._calcBptInGivenExactTokensOut([test_1.toEvmBn(big_number_1.scale(balance, 18))], [test_1.toEvmBn(big_number_1.scale(normalizedWeight, 18))], [test_1.toEvmBn(big_number_1.scale(amountOut, 18))], test_1.toEvmBn(big_number_1.scale(bptTotalSupply, 18)), test_1.toEvmBn(big_number_1.scale(swapFee, 18)));
            const sdkExecution = new Promise((resolve) => resolve(sdkWeightedMath._calcBptInGivenExactTokenOut(big_number_1.scale(balance, 18), big_number_1.scale(normalizedWeight, 18), big_number_1.scale(amountOut, 18), big_number_1.scale(bptTotalSupply, 18), big_number_1.scale(swapFee, 18))));
            chai_1.expect(await test_1.isSameResult(sdkExecution, evmExecution)).to.be.true;
        });
        it("simple values", () => {
            balance = "100";
            normalizedWeight = "0.2";
            amountOut = "50";
            bptTotalSupply = "1000";
            swapFee = "0.01";
        });
    });
    describe("_calcTokenOutGivenExactBptIn", () => {
        let balance;
        let normalizedWeight;
        let bptAmountIn;
        let bptTotalSupply;
        let swapFee;
        afterEach(async () => {
            const evmExecution = evmWeightedMath._calcTokenOutGivenExactBptIn(test_1.toEvmBn(big_number_1.scale(balance, 18)), test_1.toEvmBn(big_number_1.scale(normalizedWeight, 18)), test_1.toEvmBn(big_number_1.scale(bptAmountIn, 18)), test_1.toEvmBn(big_number_1.scale(bptTotalSupply, 18)), test_1.toEvmBn(big_number_1.scale(swapFee, 18)));
            const sdkExecution = new Promise((resolve) => resolve(sdkWeightedMath._calcTokenOutGivenExactBptIn(big_number_1.scale(balance, 18), big_number_1.scale(normalizedWeight, 18), big_number_1.scale(bptAmountIn, 18), big_number_1.scale(bptTotalSupply, 18), big_number_1.scale(swapFee, 18))));
            chai_1.expect(await test_1.isSameResult(sdkExecution, evmExecution)).to.be.true;
        });
        it("simple values", () => {
            balance = "1000";
            normalizedWeight = "0.3";
            bptAmountIn = "10";
            bptTotalSupply = "100";
            swapFee = "0.01";
        });
    });
    describe("_calcTokensOutGivenExactBptIn", () => {
        let balances;
        let bptAmountIn;
        let bptTotalSupply;
        afterEach(async () => {
            const evmExecution = evmWeightedMath._calcTokensOutGivenExactBptIn(big_number_1.scaleAll(balances, 18).map(test_1.toEvmBn), test_1.toEvmBn(big_number_1.scale(bptAmountIn, 18)), test_1.toEvmBn(big_number_1.scale(bptTotalSupply, 18)));
            const sdkExecution = new Promise((resolve) => resolve(sdkWeightedMath._calcTokensOutGivenExactBptIn(big_number_1.scaleAll(balances, 18), big_number_1.scale(bptAmountIn, 18), big_number_1.scale(bptTotalSupply, 18))));
            chai_1.expect(await test_1.isSameResult(sdkExecution, evmExecution)).to.be.true;
        });
        it("simple values", () => {
            balances = ["100", "1000", "5000"];
            bptAmountIn = "23.58";
            bptTotalSupply = "200";
        });
    });
    describe("_calcDueTokenProtocolSwapFeeAmount", () => {
        let balance;
        let normalizedWeight;
        let previousInvariant;
        let currentInvariant;
        let protocolSwapFeePercentage;
        afterEach(async () => {
            const evmExecution = evmWeightedMath._calcDueTokenProtocolSwapFeeAmount(test_1.toEvmBn(big_number_1.scale(balance, 18)), test_1.toEvmBn(big_number_1.scale(normalizedWeight, 18)), test_1.toEvmBn(big_number_1.scale(previousInvariant, 18)), test_1.toEvmBn(big_number_1.scale(currentInvariant, 18)), test_1.toEvmBn(big_number_1.scale(protocolSwapFeePercentage, 18)));
            const sdkExecution = new Promise((resolve) => resolve(sdkWeightedMath._calcDueTokenProtocolSwapFeeAmount(big_number_1.scale(balance, 18), big_number_1.scale(normalizedWeight, 18), big_number_1.scale(previousInvariant, 18), big_number_1.scale(currentInvariant, 18), big_number_1.scale(protocolSwapFeePercentage, 18))));
            chai_1.expect(await test_1.isSameResult(sdkExecution, evmExecution)).to.be.true;
        });
        it("simple values", () => {
            balance = "1000";
            normalizedWeight = "0.3";
            previousInvariant = "100000000";
            currentInvariant = "100000999";
            protocolSwapFeePercentage = "0.01";
        });
    });
});
