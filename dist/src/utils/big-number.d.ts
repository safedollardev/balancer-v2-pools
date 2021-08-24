import { BigNumber } from "bignumber.js";
export default BigNumber;
declare type BigNumberish = BigNumber | number | string;
export declare const bn: (value: BigNumberish) => BigNumber;
export declare const scale: (value: BigNumberish, decimalPlaces: number) => BigNumber;
export declare const scaleAll: (values: BigNumberish[], decimalPlaces: number) => BigNumber[];
