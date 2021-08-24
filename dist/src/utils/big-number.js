"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scaleAll = exports.scale = exports.bn = void 0;
const bignumber_js_1 = require("bignumber.js");
bignumber_js_1.BigNumber.config({
    EXPONENTIAL_AT: [-100, 100],
    ROUNDING_MODE: 1,
    DECIMAL_PLACES: 18,
});
exports.default = bignumber_js_1.BigNumber;
const bn = (value) => new bignumber_js_1.BigNumber(value);
exports.bn = bn;
const scale = (value, decimalPlaces) => exports.bn(value).times(exports.bn(10).pow(decimalPlaces));
exports.scale = scale;
const scaleAll = (values, decimalPlaces) => values.map((x) => exports.scale(x, decimalPlaces));
exports.scaleAll = scaleAll;
