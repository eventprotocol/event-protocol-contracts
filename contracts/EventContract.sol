pragma solidity ^0.4.24;

import "./EventToken.sol";

contract EventContract{
  using SafeMath for uint;
  
  // Global Variables
  enum EVENTSTATE {NOTACTIVE, ACTIVE, CANCELLED, SUCCESS}
  EventToken private _ETContract;
  address private _eventProtocolAddress;
  address private _eventTokenAddress;
  uint private _pointer = 0;
  
  // Mapping to store contract structs
  mapping(uint => _Contract) private _contracts;
  
  // constructor
  constructor(address eventProtocolAddress, address eventTokenAddress) public{
      _eventProtocolAddress = eventProtocolAddress;
      _eventTokenAddress = eventTokenAddress;
      _ETContract = EventToken(eventTokenAddress);
  }
  
  // Contract Struct
  struct _Contract{
      
      // Event metadata
      string _eventName;
      string  _eventLocation;
      uint _eventDate;
      uint _eventCreationDate;
      
      // Actors addresses
      address _buyer;
      address _seller;
      
      // Actor Escrows
      uint _buyerEscrow;
      uint _sellerEscrow;
      
      // Other parameters
      uint _sellerAdvanceFee;
      uint _sellerCancellationPenalty;
      uint _eventPaymentAmount;
      
      // Event state
      EVENTSTATE _eventState;
      
      // Event Protocol Parameters
      uint _eventProtocolCharges;
      
      // Activation Amounts
      uint _buyerTransferred;
      uint _sellerTransferred;
      
      // Resolve Event Variables
      address _resolver;
  }
    
  
  function newEvent (string eventName,
    string eventLocation,
    uint eventDate,
    address buyer,
    uint buyerEscrow,
    uint sellerEscrow,
    uint sellerAdvanceFee,
    uint sellerCancellationPenalty,
    uint eventPaymentAmount
    ) public returns (bool){
      
      _Contract memory myContract;
      
      require(eventDate > now);
      require(buyer != address(0));
      require(buyerEscrow > 0);
      require(sellerEscrow > 0);
      require(sellerAdvanceFee > 0);
      require(sellerCancellationPenalty > 0);
      require(eventPaymentAmount > 0);
      myContract._eventName = eventName;
      myContract._eventLocation = eventLocation;
      myContract._eventDate = eventDate;
      myContract._eventCreationDate = now;
      myContract._buyer = buyer;
      myContract._seller = msg.sender;
      myContract._buyerEscrow = buyerEscrow;
      myContract._sellerEscrow = sellerEscrow;
      myContract._sellerAdvanceFee = sellerAdvanceFee;
      myContract._sellerCancellationPenalty = sellerCancellationPenalty;
      myContract._eventState = EVENTSTATE.NOTACTIVE;
      myContract._eventProtocolCharges = SafeMath.div(SafeMath.mul(eventPaymentAmount, 5), 100);
      myContract._eventPaymentAmount = eventPaymentAmount.sub(myContract._eventProtocolCharges);
      
      _contracts[_pointer] = myContract;
      _pointer++;
      return true;
  }

  modifier onlyBuyer(uint _contractId){
      _Contract storage myContract = _contracts[_contractId];
      require(msg.sender == myContract._buyer);
      _;
  }

  modifier onlySeller(uint _contractId){
      _Contract storage myContract = _contracts[_contractId];
      require(msg.sender == myContract._seller);
      _;
  }

  modifier onlyBuyerAndSeller(uint _contractId){
      _Contract storage myContract = _contracts[_contractId];
      require(msg.sender == myContract._buyer || msg.sender == myContract._seller);
      _;
  }

  function tokenFallback(address _from, uint256 _value, uint _contractId) public{
      _Contract storage myContract = _contracts[_contractId];
      require(myContract._eventState == EVENTSTATE.NOTACTIVE);
      
      if (_from == myContract._buyer){
          myContract._buyerTransferred = myContract._buyerTransferred.add(_value);
      }
      
      if (_from == myContract._seller){
          myContract._sellerTransferred = myContract._sellerTransferred.add(_value);
      }
      
      if(myContract._buyerTransferred >= getBuyerActivationAmount(_contractId) && myContract._sellerTransferred >= getSellerActivationAmount(_contractId)){
        myContract._eventState = EVENTSTATE.ACTIVE;
        _ETContract.approve(myContract._seller, myContract._sellerAdvanceFee);
        _ETContract.transfer(myContract._seller, myContract._sellerAdvanceFee);
        myContract._eventPaymentAmount = myContract._eventPaymentAmount.sub(myContract._sellerAdvanceFee);
      }
  }

  function getBuyerActivationAmount(uint _contractId) public view returns (uint){
      _Contract storage myContract = _contracts[_contractId];
      return myContract._buyerEscrow.add(myContract._eventPaymentAmount).add(myContract._eventProtocolCharges);
  }

  function getSellerActivationAmount(uint _contractId) public view returns (uint){
      _Contract storage myContract = _contracts[_contractId];
      return myContract._sellerEscrow.add(myContract._sellerCancellationPenalty);
  }


  function resolveEvent(uint _contractId, uint8 val) public onlyBuyerAndSeller(_contractId) returns (bool){
      _Contract storage myContract = _contracts[_contractId];
      require(val == 1 || val == 2);
      require(myContract._eventState == EVENTSTATE.ACTIVE);
      
      myContract._resolver = msg.sender;
      if (val == 2 && myContract._eventDate > now){
        cancelEvent(_contractId);
      }

      else{
        successEvent(_contractId);
      }
      
     
      return true;
  }

  function cancelEvent(uint _contractId) internal returns (bool){
      _Contract storage myContract = _contracts[_contractId];
      
      uint _sellerCharges;
      uint _buyerCharges;
      
      // If buyer cancels the event, the advance payment will be vested with the seller
      if (myContract._resolver == myContract._buyer){
        _sellerCharges = myContract._sellerEscrow.add(myContract._sellerCancellationPenalty);
        _buyerCharges = myContract._eventPaymentAmount.add(myContract._buyerEscrow);
        payout(_contractId, myContract._eventProtocolCharges, _buyerCharges, _sellerCharges);
      }

      // If seller cancels the event, the cancellation fees will be paid back and advance may be paid back
      else{
        _sellerCharges = myContract._sellerEscrow;
        _buyerCharges = myContract._eventPaymentAmount.add(myContract._buyerEscrow).add(myContract._sellerCancellationPenalty);
        payout(_contractId, myContract._eventProtocolCharges, _buyerCharges, _sellerCharges);
      }

      myContract._eventState = EVENTSTATE.CANCELLED;
      return true;
  }

  function successEvent(uint _contractId) internal returns (bool){
      _Contract storage myContract = _contracts[_contractId];
      require(now > myContract._eventDate);
      
      uint _sellerCharges = myContract._eventPaymentAmount.add(myContract._sellerEscrow).add(myContract._sellerCancellationPenalty);
      uint _buyerCharges = myContract._buyerEscrow;
      payout(_contractId, myContract._eventProtocolCharges, _buyerCharges, _sellerCharges);
      myContract._eventState = EVENTSTATE.SUCCESS;
      return true;
  }

  function payout(uint _contractId, uint eventProtocolCharges, uint buyerAmount, uint sellerAmount) public returns (bool){
      _Contract storage myContract = _contracts[_contractId];
      _ETContract.approve(_eventProtocolAddress, eventProtocolCharges);
      _ETContract.transfer(_eventProtocolAddress, eventProtocolCharges);

      if (buyerAmount > 0){
        _ETContract.approve(myContract._buyer, buyerAmount);
        _ETContract.transfer(myContract._buyer, buyerAmount);
      }

      if (sellerAmount > 0){
        _ETContract.approve(myContract._seller, sellerAmount);
        _ETContract.transfer(myContract._seller, sellerAmount);
      }
      return true;
  }

  function getEventState(uint _contractId) public view returns (EVENTSTATE){
      _Contract storage myContract = _contracts[_contractId];
      return myContract._eventState;
  }

  function getBuyer(uint _contractId) public view returns (address){
      _Contract storage myContract = _contracts[_contractId];
      return myContract._buyer;
  }

  function getSeller(uint _contractId) public view returns (address){
      _Contract storage myContract = _contracts[_contractId];
      return myContract._seller;
  }

  function getEventDate(uint _contractId) public view returns (uint){
      _Contract storage myContract = _contracts[_contractId];
      return myContract._eventDate;
  }

  function getEventName(uint _contractId) public view returns (string){
      _Contract storage myContract = _contracts[_contractId];
      return myContract._eventName;
  }

  function getEventLocation(uint _contractId) public view returns (string){
      _Contract storage myContract = _contracts[_contractId];
      return myContract._eventLocation;
  }

  function getSellerAdvanceFee(uint _contractId) public view returns (uint){
      _Contract storage myContract = _contracts[_contractId];
      return myContract._sellerAdvanceFee;
  }

  function getSellerCancellationPenalty(uint _contractId) public view returns (uint){
      _Contract storage myContract = _contracts[_contractId];
      return myContract._sellerCancellationPenalty;
  }

  function getEventCreationDate(uint _contractId) public view returns (uint){
      _Contract storage myContract = _contracts[_contractId];
      return myContract._eventCreationDate;
  }

  function getEventProtocolAddress() public view returns (address){
      return _eventProtocolAddress;
  }

  function getEventProtocolCharges(uint _contractId) public view returns (uint){
      _Contract storage myContract = _contracts[_contractId];
      return myContract._eventProtocolCharges;
  }

  function getEventPaymentCharges(uint _contractId) public view returns (uint){
      _Contract storage myContract = _contracts[_contractId];
      return myContract._eventProtocolCharges.add(myContract._eventPaymentAmount);
  }

  function getBuyerEscrow(uint _contractId) public view returns (uint){
      _Contract storage myContract = _contracts[_contractId];
      return myContract._buyerEscrow;
  }
  
  function getSellerEscrow(uint _contractId) public view returns (uint){
      _Contract storage myContract = _contracts[_contractId];
      return myContract._sellerEscrow;
  }

  function getTokenAddress() public view returns (address){
      return address(_ETContract);
  }
  
  function getEventCount() public view returns (uint){
      return _pointer;
  }

}
