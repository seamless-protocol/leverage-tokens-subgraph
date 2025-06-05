export namespace OracleType {
  export const MORPHO_CHAINLINK = "MORPHO_CHAINLINK";
}

export namespace LendingAdapterType {
  export const MORPHO = "MORPHO";
  export const OTHER = "OTHER";
}

export namespace LeverageTokenBalanceChangeType {
  export const MINT = "MINT";
  export const REDEEM = "REDEEM";
  export const TRANSFER = "TRANSFER";
}

export const DUTCH_AUCTION_PRICE_MULTIPLIER_PRECISION_STRING = "1000000000000000000";

export const MAX_UINT256_STRING = "115792089237316195423570985008687907853269984665640564039457584007913129639935";

export const MORPHO_ORACLE_PRICE_DECIMALS = 36;

export const MORPHO_ORACLE_PRICE_SCALE_STRING = "1000000000000000000000000000000000000";

export const WAD_STRING = "1000000000000000000"

export function RebalanceActionType(value: i32): string {
  if (value == 0) return "ADD_COLLATERAL";
  if (value == 1) return "REMOVE_COLLATERAL";
  if (value == 2) return "BORROW";
  if (value == 3) return "REPAY";
  return "UNKNOWN";
}
