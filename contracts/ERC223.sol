// Interface for ERC223 Token Standard
pragma solidity ^0.4.24;

interface ERC223{
  // @notice send `_value` token to `_to` from `msg.sender`
  // @param _to The address of the recipient
  // @param _value The amount of token to be transferred
  // @param _data The data associated with the transaction
  // @return Whether the transfer was successful or not
  function transferToContract(address _to, uint256 _value, bytes _data) external returns (bool);

  event ContractTransfer(address _from, address _to, uint256 _value, bytes _data);
}
