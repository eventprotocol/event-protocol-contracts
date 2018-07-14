pragma solidity ^0.4.24;

/*************************************************
* Title: ERC223 Receiver Wrapper Contract
* Author: https://github.com/willitscale
* Date: NA
* Code version: NA
* Availability: https://github.com/willitscale/learning-solidity/blob/master/tutorial-10/ERC223ReceivingContract.sol
*************************************************/

/// @title Interface for ERC223 Receiving Contract
/// @author keshik
/// @dev The contract is a wrapper for ERC223 contracts which recieve funds
contract ERC223ReceivingContract {
    struct TKN {
     address sender;
     uint256 value;
     bytes data;
     bytes4 sig;
    }

    mapping(address => uint256) internal _transferredAmounts;
    TKN[] _transactionData;


    /* tkn variable is analogue of msg variable of Ether transaction
    *  tkn.sender is person who initiated this token transaction   (analogue of msg.sender)
    *  tkn.value the number of tokens that were sent   (analogue of msg.value)
    *  tkn.data is data of token transaction   (analogue of msg.data)
    *  tkn.sig is 4 bytes signature of function
    *  if data of token transaction is a function execution
    */
    function tokenFallback(address _from, uint256 _value, bytes _data) public {
      TKN memory tkn;
      tkn.sender = _from;
      tkn.value = _value;
      tkn.data = _data;
      uint32 u = uint32(_data[3]) + (uint32(_data[2]) << 8) + (uint32(_data[1]) << 16) + (uint32(_data[0]) << 24);
      tkn.sig = bytes4(u);
      _transferredAmounts[_from] = _value;
      _transactionData.push(tkn);
    }


}
