"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSameResult = exports.toEvmBn = exports.deployContract = void 0;
const hardhat_1 = require("hardhat");
const deployContract = async (params) => {
    const contractFactory = await hardhat_1.ethers.getContractFactory(params.name, params.from);
    const contractInstance = await contractFactory.deploy(...(params.args || []));
    return (await contractInstance.deployed());
};
exports.deployContract = deployContract;
const toEvmBn = (value) => hardhat_1.ethers.BigNumber.from(value.toString());
exports.toEvmBn = toEvmBn;
const isSameResult = async (x, y) => {
    let xErrored = false;
    let yErrored = false;
    const xResult = await x.catch(() => (xErrored = true));
    const yResult = await y.catch(() => (yErrored = true));
    if (xErrored) {
        return yErrored;
    }
    else if (yErrored) {
        return xErrored;
    }
    else {
        // Uncomment to check the actual results:
        // console.log(xResult.toString(), yResult.toString());
        return xResult.toString() === yResult.toString();
    }
};
exports.isSameResult = isSameResult;
