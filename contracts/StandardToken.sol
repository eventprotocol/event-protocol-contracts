pragma solidity ^0.4.24;

/// @title StandardToken
/// @author Keshik, Joshia
/// @dev This contract will implement the generic functionalities of a Standard ERC20 Token

import "./SafeMath.sol";

contract StandardToken{

  using SafeMath for uint256;

  // Token identities
  string internal _name;
  string internal _symbol;
  uint8 internal _decimels;
  uint256 internal _totalSupply;
  uint256 private _base = 10;

  constructor (string name, string symbol, uint8 decimels, uint256 totalTokens) internal{
      _name = name;
      _symbol = symbol;
      _decimels = decimels;
      _totalSupply = SafeMath.mul(totalTokens, _base**_decimels);
  }

  // Getter functions for contract data fields
  function name() public view returns (string){
    return _name;
  }

  function symbol() public view returns (string){
    return _symbol;
  }

  function decimels() public view returns (uint8){
    return _decimels;
  }

  function totalSupply() public view returns (uint256){
    return SafeMath.div(_totalSupply, _base**_decimels);
  }

}
