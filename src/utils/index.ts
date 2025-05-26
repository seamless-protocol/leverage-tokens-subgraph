import { Address } from "@graphprotocol/graph-ts";
import { Position } from "../../generated/schema";

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