import { Address } from "@graphprotocol/graph-ts";
import { LeverageManager } from "../../generated/schema";

export namespace LendingAdapterType {
  export const MORPHO = "MORPHO";
  export const OTHER = "OTHER";
}

export function getLeverageManager(): LeverageManager | null {
  return LeverageManager.load(Address.fromString("0xE594C57812a2f9fF9C2581E0Ca8fcBAEf0451793"))
}