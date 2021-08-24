import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";
import BigNumber from "../big-number";
declare type ContractDeploymentParams = {
    name: string;
    from: SignerWithAddress;
    args?: any[];
};
export declare const deployContract: <T extends Contract>(params: ContractDeploymentParams) => Promise<T>;
export declare const toEvmBn: (value: BigNumber) => import("ethers").BigNumber;
export declare const isSameResult: (x: Promise<any>, y: Promise<any>) => Promise<boolean>;
export {};
