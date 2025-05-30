import { Address, BigInt } from "@graphprotocol/graph-ts";
import { LeverageManager, Position } from "../../generated/schema";

export function getLeverageManagerStub(address: Address): LeverageManager {
    let leverageManager = new LeverageManager(address);

    leverageManager.totalHolders = BigInt.zero();
    leverageManager.leverageTokensCount = BigInt.zero();

    return leverageManager;
}

export function getPositionStub(
    user: Address,
    leverageToken: Address
): Position {
    const positionId = user
        .toHexString()
        .concat("-")
        .concat(leverageToken.toHexString());
    const position = new Position(positionId);
    position.user = user;
    position.leverageToken = leverageToken;
    position.balance = BigInt.zero();
    position.totalEquityDepositedInCollateral = BigInt.zero();
    position.totalEquityDepositedInDebt = BigInt.zero();
    position.realizedPnlInCollateral = BigInt.zero();
    position.realizedPnlInDebt = BigInt.zero();
    return position;
}
