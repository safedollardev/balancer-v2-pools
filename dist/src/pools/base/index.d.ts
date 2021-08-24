import BigNumber from "../../utils/big-number";
export interface IBasePoolToken {
    address: string;
    symbol: string;
    balance: string;
    decimals: number;
}
export interface IBasePoolParams {
    id: string;
    address: string;
    tokens: IBasePoolToken[];
    bptTotalSupply: string;
    swapFeePercentage: string;
    query?: boolean;
}
export default abstract class BasePool {
    private MIN_SWAP_FEE_PERCENTAGE;
    private MAX_SWAP_FEE_PERCENTAGE;
    protected _id: string;
    protected _address: string;
    protected _bptTotalSupply: string;
    protected _swapFeePercentage: string;
    protected _query: boolean;
    get id(): string;
    get address(): string;
    get bptTotalSupply(): string;
    get swapFeePercentage(): string;
    get query(): boolean;
    constructor(params: IBasePoolParams);
    setSwapFeePercentage(swapFeePercentage: string): void;
    setQuery(query: boolean): void;
    protected _upScale(amount: BigNumber | string, decimals: number): BigNumber;
    protected _downScaleDown(amount: BigNumber | string, decimals: number): BigNumber;
    protected _downScaleUp(amount: BigNumber | string, decimals: number): BigNumber;
}
