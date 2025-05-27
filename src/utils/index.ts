import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Position } from "../../generated/schema";
import { WAD_STRING } from "../constants";

export function calculateCollateralRatio(totalCollateralInDebt: BigInt, totalDebt: BigInt): BigInt {
    return totalCollateralInDebt.times(BigInt.fromString(WAD_STRING)).div(totalDebt);
}

export function getPosition(
    user: Address,
    leverageToken: Address
): Position | null {
    const positionId = user
        .toHexString()
        .concat("-")
        .concat(leverageToken.toHexString());

    return Position.load(positionId);
}