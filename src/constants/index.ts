import { Address } from "@graphprotocol/graph-ts";
import { LeverageManager } from "../../generated/schema";

export namespace LendingAdapterType {
  export const MORPHO = "MORPHO";
  export const OTHER = "OTHER";
}

export enum ExternalAction {
  MINT = 0,
  REDEEM = 1,
}

export function getLeverageManager(): LeverageManager | null {
  return LeverageManager.load(Address.fromString("0xE594C57812a2f9fF9C2581E0Ca8fcBAEf0451793"))
}

export const MAX_UINT256_STRING = "115792089237316195423570985008687907853269984665640564039457584007913129639935";