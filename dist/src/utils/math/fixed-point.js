"use strict";
// Ported from Solidity:
// https://github.com/balancer-labs/balancer-core-v2/blob/70843e6a61ad11208c1cfabf5cfe15be216ca8d3/pkg/solidity-utils/contracts/math/FixedPoint.sol
Object.defineProperty(exports, "__esModule", { value: true });
exports.complement = exports.powUp = exports.powDown = exports.divUp = exports.divDown = exports.mulUp = exports.mulDown = exports.sub = exports.add = exports.MIN_POW_BASE_FREE_EXPONENT = exports.MAX_POW_RELATIVE_ERROR = exports.ONE = exports.ZERO = void 0;
const big_number_1 = require("../big-number");
const logExp = require("./log-exp");
exports.ZERO = big_number_1.bn(0);
exports.ONE = big_number_1.bn("1000000000000000000"); // 10^18
exports.MAX_POW_RELATIVE_ERROR = big_number_1.bn(10000); // 10^(-14)
// Minimum base for the power function when the exponent is 'free' (larger than ONE)
exports.MIN_POW_BASE_FREE_EXPONENT = big_number_1.bn("700000000000000000"); // 0.7e18
const add = (a, b) => {
    // Fixed Point addition is the same as regular checked addition
    return a.plus(b);
};
exports.add = add;
const sub = (a, b) => {
    // Fixed Point subtraction is the same as regular checked subtraction
    if (b.gt(a)) {
        return new big_number_1.default(0);
        // throw new Error("SUB_OVERFLOW");
    }
    return a.minus(b);
};
exports.sub = sub;
const mulDown = (a, b) => {
    return a.times(b).idiv(exports.ONE);
};
exports.mulDown = mulDown;
const mulUp = (a, b) => {
    const product = a.times(b);
    if (product.isZero()) {
        return product;
    }
    else {
        // The traditional divUp formula is:
        // divUp(x, y) := (x + y - 1) / y
        // To avoid intermediate overflow in the addition, we distribute the division and get:
        // divUp(x, y) := (x - 1) / y + 1
        // Note that this requires x != 0, which we already tested for
        return product.minus(big_number_1.bn(1)).idiv(exports.ONE).plus(big_number_1.bn(1));
    }
};
exports.mulUp = mulUp;
const divDown = (a, b) => {
    if (b.isZero()) {
        throw new Error("ZERO_DIVISION");
    }
    if (a.isZero()) {
        return a;
    }
    else {
        return a.times(exports.ONE).idiv(b);
    }
};
exports.divDown = divDown;
const divUp = (a, b) => {
    if (b.isZero()) {
        throw new Error("ZERO_DIVISION");
    }
    if (a.isZero()) {
        return a;
    }
    else {
        // The traditional divUp formula is:
        // divUp(x, y) := (x + y - 1) / y
        // To avoid intermediate overflow in the addition, we distribute the division and get:
        // divUp(x, y) := (x - 1) / y + 1
        // Note that this requires x != 0, which we already tested for.
        return a.times(exports.ONE).minus(big_number_1.bn(1)).idiv(b).plus(big_number_1.bn(1));
    }
};
exports.divUp = divUp;
const powDown = (x, y) => {
    const raw = logExp.pow(x, y);
    const maxError = exports.add(exports.mulUp(raw, exports.MAX_POW_RELATIVE_ERROR), big_number_1.bn(1));
    if (raw.lt(maxError)) {
        return big_number_1.bn(0);
    }
    else {
        return exports.sub(raw, maxError);
    }
};
exports.powDown = powDown;
const powUp = (x, y) => {
    const raw = logExp.pow(x, y);
    const maxError = exports.add(exports.mulUp(raw, exports.MAX_POW_RELATIVE_ERROR), big_number_1.bn(1));
    return exports.add(raw, maxError);
};
exports.powUp = powUp;
const complement = (x) => {
    return x.lt(exports.ONE) ? exports.ONE.minus(x) : big_number_1.bn(0);
};
exports.complement = complement;
