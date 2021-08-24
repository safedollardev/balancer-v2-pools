"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exitUserData = exports.joinUserData = void 0;
const ethers_1 = require("ethers");
const EXACT_TOKENS_IN_FOR_BPT_OUT_TAG = 1;
const TOKEN_IN_FOR_EXACT_BPT_OUT_TAG = 2;
function joinUserData(joinData) {
    if (joinData.kind == "ExactTokensInForBptOut") {
        return ethers_1.utils.defaultAbiCoder.encode(["uint256", "uint256[]", "uint256"], [EXACT_TOKENS_IN_FOR_BPT_OUT_TAG, joinData.amountsIn, joinData.minimumBpt]);
    }
    else {
        return ethers_1.utils.defaultAbiCoder.encode(["uint256", "uint256", "uint256"], [TOKEN_IN_FOR_EXACT_BPT_OUT_TAG, joinData.bptOut, joinData.tokenInIndex]);
    }
}
exports.joinUserData = joinUserData;
const EXACT_BPT_IN_FOR_TOKEN_OUT_TAG = 0;
const EXACT_BPT_IN_FOR_TOKENS_OUT_TAG = 1;
const BPT_IN_FOR_EXACT_TOKENS_OUT_TAG = 2;
function exitUserData(exitData) {
    if (exitData.kind == "ExactBptInForTokenOut") {
        return ethers_1.utils.defaultAbiCoder.encode(["uint256", "uint256", "uint256"], [EXACT_BPT_IN_FOR_TOKEN_OUT_TAG, exitData.bptIn, exitData.tokenOutIndex]);
    }
    else if (exitData.kind == "ExactBptInForTokensOut") {
        return ethers_1.utils.defaultAbiCoder.encode(["uint256", "uint256"], [EXACT_BPT_IN_FOR_TOKENS_OUT_TAG, exitData.bptIn]);
    }
    else {
        return ethers_1.utils.defaultAbiCoder.encode(["uint256", "uint256[]", "uint256"], [
            BPT_IN_FOR_EXACT_TOKENS_OUT_TAG,
            exitData.amountsOut,
            exitData.maximumBpt,
        ]);
    }
}
exports.exitUserData = exitUserData;
