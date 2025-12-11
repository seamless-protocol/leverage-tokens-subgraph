export const LEVERAGE_MANAGER_ADDRESS = "{{base.LeverageManager.address}}"

export const MORPHO_CHAINLINK_ORACLE_V2_RLP_USDC_ADDRESS = "{{base.MorphoChainlinkOracleV2-RLP-USDC.address}}"
export const MORPHO_CHAINLINK_ORACLE_V2_SIUSD_USDC_ADDRESS = "{{base.MorphoChainlinkOracleV2-siUSD-USDC.address}}"
export const MORPHO_CHAINLINK_ORACLE_V2_WSTETH_STETH_ADDRESS = "{{base.MorphoChainlinkOracleV2-wstETH-stETH.address}}"

// TODO: Uncomment this when there are oracles set to be polled
// export const CHAINLINK_ORACLE_POLLING_ADDRESSES = "{{base.ChainlinkOraclePolling.oracles}}".split(",")
export const CHAINLINK_ORACLE_POLLING_ADDRESSES: string[] = []