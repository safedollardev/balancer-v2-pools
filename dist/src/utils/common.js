"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shallowCopyAll = exports.shallowCopy = void 0;
const shallowCopy = (obj) => {
    return Object.assign({}, obj);
};
exports.shallowCopy = shallowCopy;
const shallowCopyAll = (objs) => {
    return objs.map(exports.shallowCopy);
};
exports.shallowCopyAll = shallowCopyAll;
