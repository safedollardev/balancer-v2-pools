"use strict";
// Ported from Solidity:
// https://github.com/balancer-labs/balancer-v2-monorepo/blob/ce70f7663e0ac94b25ed60cb86faaa8199fd9e13/pkg/solidity-utils/contracts/math/Math.sol
Object.defineProperty(exports, "__esModule", { value: true });
exports.divUp = exports.divDown = exports.div = exports.mul = exports.min = exports.max = exports.sub = exports.add = exports.TWO = exports.ONE = exports.ZERO = void 0;
const big_number_1 = require("../big-number");
exports.ZERO = big_number_1.bn(0);
exports.ONE = big_number_1.bn(1);
exports.TWO = big_number_1.bn(2);
const add = (a, b) => {
    return a.plus(b);
};
exports.add = add;
const sub = (a, b) => {
    if (b.gt(a)) {
        throw new Error("SUB_OVERFLOW");
    }
    return a.minus(b);
};
exports.sub = sub;
const max = (a, b) => {
    return a.gte(b) ? a : b;
};
exports.max = max;
const min = (a, b) => {
    return a.lt(b) ? a : b;
};
exports.min = min;
const mul = (a, b) => {
    return a.times(b);
};
exports.mul = mul;
const div = (a, b, roundUp) => {
    return roundUp ? exports.divUp(a, b) : exports.divDown(a, b);
};
exports.div = div;
const divDown = (a, b) => {
    if (b.isZero()) {
        throw new Error("ZERO_DIVISION");
    }
    return a.idiv(b);
};
exports.divDown = divDown;
const divUp = (a, b) => {
    if (b.isZero()) {
        throw new Error("ZERO_DIVISION");
    }
    return a.isZero() ? exports.ZERO : exports.ONE.plus(a.minus(exports.ONE).idiv(b));
};
exports.divUp = divUp;
