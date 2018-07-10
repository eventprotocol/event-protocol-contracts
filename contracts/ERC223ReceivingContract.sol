// Interface for ERC223 Receiving Contract
pragma solidity ^0.4.24;

interface ERC223ReceivingContract {
    function tokenFallback(address _from, uint _value, bytes _data) external;
}
