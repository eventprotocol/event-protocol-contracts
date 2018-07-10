pragma solidity ^0.4.24;

/// @title Interface for ERC223 Receiving Contract
/// @author keshik
/// @dev The contract is a wrapper for ERC223 contracts which recieve funds
interface ERC223ReceivingContract {
    function tokenFallback(address _from, uint _value, bytes _data) external;
}
