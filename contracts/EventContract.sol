pragma solidity ^0.4.24;

import "./EventToken.sol";

contract EventContract{
  using SafeMath for uint;
  enum EVENTSTATE {NOTACTIVE, ACTIVE, POSTPONEMENT, CANCELLATION, REPORTING, DISPUTED, SETTLED}
  string private _eventName;
  string private _eventLocation;
  uint private _eventDate;
  uint private _eventCreationDate;
  address private _buyer;
  address private _seller;
  uint8 private _noOfAllowedPostponements;
  mapping(address => uint256) private _escrows;
  uint256 private _buyerAdvanceFee;
  mapping(address => uint256) private _cancellationFees;
  address[] private _arbiterAddresses;
  address[] private _contributerAddresses;
  mapping(address => uint256) private _arbitrationAmounts;
  mapping(address => uint256) private _contributionPoolAmounts;
  uint private _eventPaymentAmount;
  EVENTSTATE private _eventState;
  address private _eventProtocolAddress;
  EventToken private _ETContract;
  address private _cancellingParty;


  struct TKN {
   address sender;
   uint256 value;
   bytes data;
   bytes4 sig;
  }

  mapping(address => uint256) internal _transferredAmounts;
  TKN[] _transactionData;

  mapping(uint => mapping(address => bool)) private _postPoneRequest;
  mapping(address => bool) private _cancelRequest;

  constructor (string eventName,
    string eventLocation,
    uint eventDate,
    address buyer,
    address seller,
    uint8 allowedPostponements,
    uint buyerEscrow,
    uint sellerEscrow,
    uint buyerAdvanceFee,
    uint buyerCancellationFee,
    uint sellerCancellationFee,
    uint buyerContributionPoolAmount,
    uint sellerContributionPoolAmount,
    uint eventPaymentAmount,
    address eventProtocolAddress,
    address eventTokenAddress) public{

      require(eventDate > now);
      require(allowedPostponements < 3);
      require(buyer != address(0));
      require(seller != address(0));
      require(buyerEscrow > 0);
      require(sellerEscrow > 0);
      require(buyerAdvanceFee > 0);
      require(buyerCancellationFee > 0);
      require(sellerCancellationFee > 0);
      require(buyerContributionPoolAmount > 0);
      require(sellerContributionPoolAmount > 0);
      require(eventPaymentAmount > 0);
      _eventName = eventName;
      _eventLocation = eventLocation;
      _eventDate = eventDate;
      _eventCreationDate = now;
      _buyer = buyer;
      _seller = seller;
      _noOfAllowedPostponements = allowedPostponements;
      _escrows[_buyer] = buyerEscrow;
      _escrows[_seller] = sellerEscrow;
      _buyerAdvanceFee = buyerAdvanceFee;
      _cancellationFees[_buyer] = buyerCancellationFee;
      _cancellationFees[_seller] = sellerCancellationFee;
      _contributionPoolAmounts[_buyer] = buyerContributionPoolAmount;
      _contributionPoolAmounts[_seller] = sellerContributionPoolAmount;
      _eventPaymentAmount = eventPaymentAmount;
      _eventProtocolAddress = eventProtocolAddress;
      _ETContract = EventToken(eventTokenAddress);
      _eventState = EVENTSTATE.NOTACTIVE;
  }

  modifier onlyBuyer{
      require(msg.sender == _buyer);
      _;
  }

  modifier onlySeller{
      require(msg.sender == _seller);
      _;
  }

  modifier onlyBuyerAndSeller{
      require(msg.sender == _buyer || msg.sender == _seller);
      _;
  }

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


  function submitPostponeRequest(uint newEventDate) public onlyBuyerAndSeller returns (bool){
      _postPoneRequest[newEventDate][msg.sender] = true;
      _eventState = EVENTSTATE.POSTPONEMENT;
      postPoneEvent(newEventDate);
  }

  function postPoneEvent(uint newEventDate) internal returns (bool){
      require(_postPoneRequest[newEventDate][_buyer] == true);
      require(_postPoneRequest[newEventDate][_seller] == true);
      _eventDate = newEventDate;
      _eventState = EVENTSTATE.ACTIVE;
      return true;
  }

  function submitCancelRequest() public onlyBuyerAndSeller returns (bool){
      require(_eventState == EVENTSTATE.ACTIVE);
      require(_eventDate > now);
      _cancelRequest[msg.sender] = true;
      _cancellingParty = msg.sender;
      _eventState = EVENTSTATE.CANCELLATION;
  }

  function acknowledgeCancel() public onlyBuyerAndSeller returns (bool){
      require(_eventState == EVENTSTATE.ACTIVE);
      require(_eventDate > now);
      _cancelRequest[msg.sender] = true;
      cancelEvent();
  }

  function cancelEvent() internal returns (bool){
      require(_eventState == EVENTSTATE.ACTIVE);
      require(_eventDate > now);
      require(_cancelRequest[_buyer] == true);
      require(_cancelRequest[_seller] == true);

      //What if the buyer cancelles the event (Seller's cancellation fees should be > advance fee)
      uint _eventProtcolCharges = (_eventPaymentAmount * 5)/100;

      if (_cancellingParty == _buyer){
        uint _sellerCharges = (_cancellationFees[_seller].sub(_buyerAdvanceFee)).add(_escrows[_seller]);
        uint _buyerPayment = _ETContract.balanceOf(_buyer);
        _ETContract.approve(_eventProtocolAddress, _eventProtcolCharges);
        _ETContract.transfer(_eventProtocolAddress, _eventProtcolCharges);
        _ETContract.approve(_seller, _sellerCharges);
        _ETContract.transfer(_seller, _sellerCharges);
        _ETContract.approve(_buyer, _buyerPayment);
        _ETContract.transfer(_seller, _buyerPayment);
        _eventState = EVENTSTATE.SETTLED;
        return true;
      }

      // Seller's cancel case will be handled later
      return false;


  }















}
