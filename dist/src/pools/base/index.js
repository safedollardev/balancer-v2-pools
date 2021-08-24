"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const big_number_1 = require("../../utils/big-number");
const math = require("../../utils/math/math");
class BasePool {
    // ---------------------- Constructor ----------------------
    constructor(params) {
        this.MIN_SWAP_FEE_PERCENTAGE = big_number_1.bn("0.000001"); // 0.0001%
        this.MAX_SWAP_FEE_PERCENTAGE = big_number_1.bn("0.1"); // 10%
        this._query = false;
        this._id = params.id;
        this._address = params.address;
        this._bptTotalSupply = params.bptTotalSupply;
        this.setSwapFeePercentage(params.swapFeePercentage);
        if (params.query) {
            this._query = params.query;
        }
    }
    // ---------------------- Getters ----------------------
    get id() {
        return this._id;
    }
    get address() {
        return this._address;
    }
    get bptTotalSupply() {
        return this._bptTotalSupply;
    }
    get swapFeePercentage() {
        return this._swapFeePercentage;
    }
    get query() {
        return this._query;
    }
    // ---------------------- Setters ----------------------
    setSwapFeePercentage(swapFeePercentage) {
        if (big_number_1.bn(swapFeePercentage).lt(this.MIN_SWAP_FEE_PERCENTAGE)) {
            throw new Error("MIN_SWAP_FEE_PERCENTAGE");
        }
        if (big_number_1.bn(swapFeePercentage).gt(this.MAX_SWAP_FEE_PERCENTAGE)) {
            throw new Error("MAX_SWAP_FEE_PERCENTAGE");
        }
        this._swapFeePercentage = swapFeePercentage;
    }
    setQuery(query) {
        this._query = query;
    }
    // ---------------------- Internal ----------------------
    _upScale(amount, decimals) {
        return math.mul(big_number_1.scale(amount, decimals), big_number_1.bn(10).pow(18 - decimals));
    }
    _downScaleDown(amount, decimals) {
        return big_number_1.scale(math.divDown(big_number_1.bn(amount), big_number_1.bn(10).pow(18 - decimals)), -decimals);
    }
    _downScaleUp(amount, decimals) {
        return big_number_1.scale(math.divUp(big_number_1.bn(amount), big_number_1.bn(10).pow(18 - decimals)), -decimals);
    }
}
exports.default = BasePool;
