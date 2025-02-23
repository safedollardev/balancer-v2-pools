import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

import WeightedPool, { IWeightedPoolToken } from "../../src/pools/weighted";
import { bn } from "../../src/utils/big-number";
import { isSameResult } from "../../src/utils/test";
import * as query from "../../src/utils/test/pools/query";

describe("WeightedPool", () => {
  let sdkPool: WeightedPool;
  let evmVault: Contract;
  let evmHelpers: Contract;

  before(async () => {
    sdkPool = await WeightedPool.initFromRealPool(
      // WETH/DAI 60/40 on Mainnet
      "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a",
      true,
      Number(process.env.BLOCK_NUMBER)
    );

    const vault = require("@balancer-labs/v2-deployments/deployed/mainnet/Vault.json");
    evmVault = await ethers.getContractAt(vault.abi, vault.address);

    const helpers = require("@balancer-labs/v2-deployments/deployed/mainnet/BalancerHelpers.json");
    evmHelpers = await ethers.getContractAt(helpers.abi, helpers.address);

    // For some reason, the actual on-chain swap fee differs from what is
    // returned from the subgraph, so to make the tests pass we update the
    // swap fee to what is on-chain

    const iface = new ethers.utils.Interface([
      "function getSwapFeePercentage() view returns (uint256)",
    ]);
    const rawSwapFeePercentage = await ethers.provider.call({
      to: sdkPool.address,
      data: iface.encodeFunctionData("getSwapFeePercentage"),
    });
    const swapFeePercentage = ethers.utils.formatEther(
      iface
        .decodeFunctionResult("getSwapFeePercentage", rawSwapFeePercentage)
        .toString()
    );

    sdkPool.setSwapFeePercentage(swapFeePercentage);
  });

  describe("swapGivenIn", () => {
    let tokenIn: IWeightedPoolToken;
    let tokenOut: IWeightedPoolToken;
    let amountIn: string;

    afterEach(async () => {
      const evmExecution = query.swapGivenIn(
        evmVault,
        sdkPool.id,
        [tokenIn, tokenOut],
        tokenIn.symbol,
        tokenOut.symbol,
        amountIn
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(sdkPool.swapGivenIn(tokenIn.symbol, tokenOut.symbol, amountIn))
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      tokenIn = sdkPool.tokens[0];
      tokenOut = sdkPool.tokens[1];
      // 0.1% of the balance
      amountIn = bn(tokenIn.balance)
        .div(1000)
        .decimalPlaces(tokenIn.decimals)
        .toString();
    });

    it("extreme values", () => {
      tokenIn = sdkPool.tokens[1];
      tokenOut = sdkPool.tokens[0];
      // 50% of the balance
      amountIn = bn(tokenIn.balance)
        .div(2)
        .decimalPlaces(tokenIn.decimals)
        .toString();
    });
  });

  describe("swapGivenOut", () => {
    let tokenIn: IWeightedPoolToken;
    let tokenOut: IWeightedPoolToken;
    let amountOut: string;

    afterEach(async () => {
      const evmExecution = query.swapGivenOut(
        evmVault,
        sdkPool.id,
        [tokenIn, tokenOut],
        tokenIn.symbol,
        tokenOut.symbol,
        amountOut
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkPool.swapGivenOut(tokenIn.symbol, tokenOut.symbol, amountOut)
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      tokenIn = sdkPool.tokens[0];
      tokenOut = sdkPool.tokens[1];
      // 0.1% of the balance
      amountOut = bn(tokenOut.balance)
        .div(1000)
        .decimalPlaces(tokenOut.decimals)
        .toString();
    });

    it("extreme values", () => {
      tokenIn = sdkPool.tokens[1];
      tokenOut = sdkPool.tokens[0];
      // 50% of the balance
      amountOut = bn(tokenOut.balance)
        .div(2)
        .decimalPlaces(tokenOut.decimals)
        .toString();
    });
  });

  describe("joinExactTokensInForBptOut", () => {
    let amountsIn: { [symbol: string]: string };

    afterEach(async () => {
      const evmExecution = query.joinExactTokensInForBptOut(
        evmHelpers,
        sdkPool.id,
        sdkPool.tokens,
        sdkPool.tokens.map((t) => amountsIn[t.symbol])
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(sdkPool.joinExactTokensInForBptOut(amountsIn))
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
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
    let tokenIn: IWeightedPoolToken;
    let bptOut: string;

    afterEach(async () => {
      const evmExecution = query.joinTokenInForExactBptOut(
        evmHelpers,
        sdkPool.id,
        sdkPool.tokens,
        tokenIn.symbol,
        bptOut
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(sdkPool.joinTokenInForExactBptOut(tokenIn.symbol, bptOut))
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
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
    let tokenOut: IWeightedPoolToken;
    let bptIn: string;

    afterEach(async () => {
      const evmExecution = query.exitExactBptInForTokenOut(
        evmHelpers,
        sdkPool.id,
        sdkPool.tokens,
        tokenOut.symbol,
        bptIn
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(sdkPool.exitExactBptInForTokenOut(tokenOut.symbol, bptIn))
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
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
    let bptIn: string;

    afterEach(async () => {
      const evmExecution = query.exitExactBptInForTokensOut(
        evmHelpers,
        sdkPool.id,
        sdkPool.tokens,
        bptIn
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(sdkPool.exitExactBptInForTokensOut(bptIn))
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      bptIn = "1000";
    });

    it("extreme values", () => {
      bptIn = "99999999";
    });
  });

  describe("exitBptInForExactTokensOut", () => {
    let amountsOut: { [symbol: string]: string };

    afterEach(async () => {
      const evmExecution = query.exitBptInForExactTokensOut(
        evmHelpers,
        sdkPool.id,
        sdkPool.tokens,
        sdkPool.tokens.map((t) => amountsOut[t.symbol])
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(sdkPool.exitBptInForExactTokensOut(amountsOut))
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
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
