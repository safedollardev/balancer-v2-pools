"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
dotenv_1.config();
require("@nomiclabs/hardhat-waffle");
const config = {
    defaultNetwork: "hardhat",
    solidity: "0.7.4",
    networks: {
        hardhat: {
            forking: {
                url: process.env.RPC_URL,
                blockNumber: Number(process.env.BLOCK_NUMBER),
            },
        },
    },
};
exports.default = config;
