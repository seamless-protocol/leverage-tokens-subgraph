/**
 * Utils from the siUSD contract https://etherscan.io/address/0xDBDC1Ef57537E34680B898E1FEBD3D68c7389bCB#code
 */

import { BigInt } from "@graphprotocol/graph-ts";
import { siUsdEpochReward } from "../../generated/schema";

const EPOCH = BigInt.fromI32(604800);
const EPOCH_OFFSET = BigInt.fromI32(259200);

/**
 * Gets the epoch number from a timestamp
 */
export function getEpoch(timestamp: BigInt): BigInt {
    return timestamp.minus(EPOCH_OFFSET).div(EPOCH)
}

/**
 * Converts an epoch number to its starting timestamp
 */
export function epochToTimestamp(epoch: BigInt): BigInt {
    return epoch.times(EPOCH).plus(EPOCH_OFFSET);
}

/**
 * Gets the next epoch number from a timestamp
 */
export function getNextEpoch(timestamp: BigInt): BigInt {
    return getEpoch(timestamp).plus(BigInt.fromI32(1));
}

/**
 * Returns the amount of rewards for the current epoch minus the rewards that are already available
 * @param timestamp - current block timestamp
 * @returns unavailable current epoch rewards
 */
export function getUnavailableCurrentEpochRewards(timestamp: BigInt): BigInt {
    const currentEpoch = getEpoch(timestamp);

    // Load epoch rewards from storage
    const epochRewardEntity = siUsdEpochReward.load(currentEpoch.toString());
    const currentEpochRewards = epochRewardEntity ? epochRewardEntity.rewards : BigInt.zero();

    const elapsed = timestamp.minus(epochToTimestamp(currentEpoch));
    const availableEpochRewards = currentEpochRewards.times(elapsed).div(EPOCH);

    return currentEpochRewards.minus(availableEpochRewards);
}

/**
 * Returns the total assets, excluding the rewards that are not available yet
 * @param baseAssets - the base total assets value (equivalent to super.totalAssets())
 * @param timestamp - current block timestamp
 * @returns adjusted total assets
 */
export function getTotalAssets(baseAssets: BigInt, timestamp: BigInt): BigInt {
    const nextEpoch = getNextEpoch(timestamp);

    // Load next epoch rewards
    const nextEpochRewardEntity = siUsdEpochReward.load(nextEpoch.toString());
    const nextEpochRewards = nextEpochRewardEntity ? nextEpochRewardEntity.rewards : BigInt.zero();

    const unavailableCurrentRewards = getUnavailableCurrentEpochRewards(timestamp);

    return baseAssets.minus(nextEpochRewards).minus(unavailableCurrentRewards);
}

