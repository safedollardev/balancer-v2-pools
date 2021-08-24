"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
const weighted_1 = require("../../src/pools/weighted");
const big_number_1 = require("../../src/utils/big-number");
const test_1 = require("../../src/utils/test");
const query = require("../../src/utils/test/pools/query");
describe("WeightedPool", () => {
    let sdkPool;
    let evmVault;
    let evmHelpers;
    before(async () => {
        sdkPool = await weighted_1.default.initFromRealPool(
        // WETH/DAI 60/40 on Mainnet
        "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a", true, Number(process.env.BLOCK_NUMBER));
        const vault = require("@balancer-labs/v2-deployments/deployed/mainnet/Vault.json");
        evmVault = await hardhat_1.ethers.getContractAt(vault.abi, vault.address);
        const helpers = require("@balancer-labs/v2-deployments/deployed/mainnet/BalancerHelpers.json");
        evmHelpers = await hardhat_1.ethers.getContractAt(helpers.abi, helpers.address);
        // For some reason, the actual on-chain swap fee differs from what is
        // returned from the subgraph, so to make the tests pass we update the
        // swap fee to what is on-chain
        const iface = new hardhat_1.ethers.utils.Interface([
            "function getSwapFeePercentage() view returns (uint256)",
        ]);
        const rawSwapFeePercentage = await hardhat_1.ethers.provider.call({
            to: sdkPool.address,
            data: iface.encodeFunctionData("getSwapFeePercentage"),
        });
        const swapFeePercentage = hardhat_1.ethers.utils.formatEther(iface
            .decodeFunctionResult("getSwapFeePercentage", rawSwapFeePercentage)
            .toString());
        sdkPool.setSwapFeePercentage(swapFeePercentage);
    });
    describe("swapGivenIn", () => {
        let tokenIn;
        let tokenOut;
        let amountIn;
        afterEach(async () => {
            const evmExecution = query.swapGivenIn(evmVault, sdkPool.id, [tokenIn, tokenOut], tokenIn.symbol, tokenOut.symbol, amountIn);
            const sdkExecution = new Promise((resolve) => resolve(sdkPool.swapGivenIn(tokenIn.symbol, tokenOut.symbol, amountIn)));
            chai_1.expect(await test_1.isSameResult(sdkExecution, evmExecution)).to.be.true;
        });
        it("simple values", () => {
            tokenIn = sdkPool.tokens[0];
            tokenOut = sdkPool.tokens[1];
            // 0.1% of the balance
            amountIn = big_number_1.bn(tokenIn.balance)
                .div(1000)
                .decimalPlaces(tokenIn.decimals)
                .toString();
        });
        it("extreme values", () => {
            tokenIn = sdkPool.tokens[1];
            tokenOut = sdkPool.tokens[0];
            // 50% of the balance
            amountIn = big_number_1.bn(tokenIn.balance)
                .div(2)
                .decimalPlaces(tokenIn.decimals)
                .toString();
        });
    });
    describe("swapGivenOut", () => {
        let tokenIn;
        let tokenOut;
        let amountOut;
        afterEach(async () => {
            const evmExecution = query.swapGivenOut(evmVault, sdkPool.id, [tokenIn, tokenOut], tokenIn.symbol, tokenOut.symbol, amountOut);
            const sdkExecution = new Promise((resolve) => resolve(sdkPool.swapGivenOut(tokenIn.symbol, tokenOut.symbol, amountOut)));
            chai_1.expect(await test_1.isSameResult(sdkExecution, evmExecution)).to.be.true;
        });
        it("simple values", () => {
            tokenIn = sdkPool.tokens[0];
            tokenOut = sdkPool.tokens[1];
            // 0.1% of the balance
            amountOut = big_number_1.bn(tokenOut.balance)
                .div(1000)
                .decimalPlaces(tokenOut.decimals)
                .toString();
        });
        it("extreme values", () => {
            tokenIn = sdkPool.tokens[1];
            tokenOut = sdkPool.tokens[0];
            // 50% of the balance
            amountOut = big_number_1.bn(tokenOut.balance)
                .div(2)
                .decimalPlaces(tokenOut.decimals)
                .toString();
        });
    });
    describe("joinExactTokensInForBptOut", () => {
        let amountsIn;
        afterEach(async () => {
            const evmExecution = query.joinExactTokensInForBptOut(evmHelpers, sdkPool.id, sdkPool.tokens, sdkPool.tokens.map((t) => amountsIn[t.symbol]));
            const sdkExecution = new Promise((resolve) => resolve(sdkPool.joinExactTokensInForBptOut(amountsIn)));
            chai_1.expect(await test_1.isSameResult(sdkExecution, evmExecution)).to.be.true;
        });
        it("simple values", () => {
            amountsIn = {
                DAI: "100000",
                WETH: "500",
            };
        });
        it("extreme values", () => {
            amountsIn = {
                DAI: "1",
                WETH: "10000",
            };
        });
    });
    describe("joinTokenInForExactBptOut", () => {
        let tokenIn;
        let bptOut;
        afterEach(async () => {
            const evmExecution = query.joinTokenInForExactBptOut(evmHelpers, sdkPool.id, sdkPool.tokens, tokenIn.symbol, bptOut);
            const sdkExecution = new Promise((resolve) => resolve(sdkPool.joinTokenInForExactBptOut(tokenIn.symbol, bptOut)));
            chai_1.expect(await test_1.isSameResult(sdkExecution, evmExecution)).to.be.true;
        });
        it("simple values", () => {
            tokenIn = sdkPool.tokens[0];
            bptOut = "10";
        });
        it("extreme values", () => {
            tokenIn = sdkPool.tokens[1];
            bptOut = "1000000000";
        });
    });
    describe("exitExactBptInForTokenOut", () => {
        let tokenOut;
        let bptIn;
        afterEach(async () => {
            const evmExecution = query.exitExactBptInForTokenOut(evmHelpers, sdkPool.id, sdkPool.tokens, tokenOut.symbol, bptIn);
            const sdkExecution = new Promise((resolve) => resolve(sdkPool.exitExactBptInForTokenOut(tokenOut.symbol, bptIn)));
            chai_1.expect(await test_1.isSameResult(sdkExecution, evmExecution)).to.be.true;
        });
        it("simple values", () => {
            tokenOut = sdkPool.tokens[0];
            bptIn = "100";
        });
        it("extreme values", () => {
            tokenOut = sdkPool.tokens[1];
            bptIn = "10000000";
        });
    });
    describe("exitExactBptInForTokensOut", () => {
        let bptIn;
        afterEach(async () => {
            const evmExecution = query.exitExactBptInForTokensOut(evmHelpers, sdkPool.id, sdkPool.tokens, bptIn);
            const sdkExecution = new Promise((resolve) => resolve(sdkPool.exitExactBptInForTokensOut(bptIn)));
            chai_1.expect(await test_1.isSameResult(sdkExecution, evmExecution)).to.be.true;
        });
        it("simple values", () => {
            bptIn = "1000";
        });
        it("extreme values", () => {
            bptIn = "99999999";
        });
    });
    describe("exitBptInForExactTokensOut", () => {
        let amountsOut;
        afterEach(async () => {
            const evmExecution = query.exitBptInForExactTokensOut(evmHelpers, sdkPool.id, sdkPool.tokens, sdkPool.tokens.map((t) => amountsOut[t.symbol]));
            const sdkExecution = new Promise((resolve) => resolve(sdkPool.exitBptInForExactTokensOut(amountsOut)));
            chai_1.expect(await test_1.isSameResult(sdkExecution, evmExecution)).to.be.true;
        });
        it("simple values", () => {
            amountsOut = {
                DAI: "100000",
                WETH: "100",
            };
        });
        it("extreme values", () => {
            amountsOut = {
                DAI: "100000000",
                WETH: "100000000",
            };
        });
    });
});
