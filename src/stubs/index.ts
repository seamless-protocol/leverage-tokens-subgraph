import { Address, BigInt } from "@graphprotocol/graph-ts";
import { LeverageManager, Position } from "../../generated/schema";

export function getLeverageManagerStub(address: Address): LeverageManager {
    let leverageManager = new LeverageManager(address);
    leverageManager.admin = Address.zero();
    leverageManager.feeManagerRole = Address.zero();
    leverageManager.treasury = Address.zero();

    leverageManager.leverageTokenFactory = Address.zero();

    leverageManager.mintTreasuryActionFee = BigInt.zero();
    leverageManager.redeemTreasuryActionFee = BigInt.zero();
    leverageManager.defaultManagementFeeAtCreation = BigInt.zero();

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
    position.equityInCollateral = BigInt.zero();
    position.equityInDebt = BigInt.zero();
    return position;
}
