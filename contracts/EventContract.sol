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
  uint256 private _sellerAdvanceFee;
  uint256 private _sellerCancellationPenalty;
  address[] private _arbiterAddressesBuyer;
  address[] private _arbiterAddressesSeller;
  address[] private _contributerAddressesBuyer;
  address[] private _contributerAddressesSeller;
  mapping(address => uint256) private _contributionPoolAmounts;
  mapping(address => mapping(address => uint256)) private _contributersAcknowledgement;
  uint private _eventPaymentAmount;
  EVENTSTATE private _eventState;
  address private _eventProtocolAddress;
  EventToken private _ETContract;
  address private _cancellingParty;
  uint256 private _eventProtocolCharges;

  //Helper data function
  mapping(address => mapping(address => bool)) private _isContributor;

  struct TKN {
   address sender;
   uint256 value;
   bytes data;
   bytes4 sig;
  }

  mapping(address => uint256) internal _transferredAmounts;
  TKN[] _transactionData;

  mapping(uint => mapping(address => bool)) private _postPoneRequest;
  mapping(address => uint8) private _resolveEvent;

  constructor (string eventName,
    string eventLocation,
    uint eventDate,
    address buyer,
    uint8 allowedPostponements,
    uint buyerEscrow,
    uint sellerEscrow,
    uint sellerAdvanceFee,
    uint sellerCancellationPenalty,
    uint buyerContributionPoolAmount,
    uint sellerContributionPoolAmount,
    uint eventPaymentAmount,
    address eventProtocolAddress,
    address eventTokenAddress) public{

      require(eventDate > now);
      require(allowedPostponements < 3);
      require(buyer != address(0));
      require(buyerEscrow > 0);
      require(sellerEscrow > 0);
      require(sellerAdvanceFee > 0);
      require(sellerCancellationPenalty > 0);
      require(buyerContributionPoolAmount > 0);
      require(sellerContributionPoolAmount > 0);
      require(eventPaymentAmount > 0);
      _eventName = eventName;
      _eventLocation = eventLocation;
      _eventDate = eventDate;
      _eventCreationDate = now;
      _buyer = buyer;
      _seller = msg.sender;
      _noOfAllowedPostponements = allowedPostponements;
      _escrows[_buyer] = buyerEscrow;
      _escrows[_seller] = sellerEscrow;
      _sellerAdvanceFee = sellerAdvanceFee;
      _sellerCancellationPenalty = sellerCancellationPenalty;
      _contributionPoolAmounts[_buyer] = buyerContributionPoolAmount;
      _contributionPoolAmounts[_seller] = sellerContributionPoolAmount;
      _eventProtocolAddress = eventProtocolAddress;
      _ETContract = EventToken(eventTokenAddress);
      _eventState = EVENTSTATE.NOTACTIVE;
      _eventProtocolCharges = SafeMath.div(SafeMath.mul(eventPaymentAmount, 5), 100);
      _eventPaymentAmount = eventPaymentAmount.sub(_eventProtocolCharges);
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

  function tokenFallback(address _from, uint256 _value, bytes _data) public{
      require(_eventState == EVENTSTATE.NOTACTIVE);
      TKN memory tkn;
      tkn.sender = _from;
      tkn.value = _value;
      tkn.data = _data;
      uint32 u = uint32(_data[3]) + (uint32(_data[2]) << 8) + (uint32(_data[1]) << 16) + (uint32(_data[0]) << 24);
      tkn.sig = bytes4(u);
      _transferredAmounts[_from] = _transferredAmounts[_from].add(_value);
      _transactionData.push(tkn);

      if(_transferredAmounts[_buyer] >= getBuyerActivationAmount() && _transferredAmounts[_seller] >= getSellerActivationAmount()){
        _eventState = EVENTSTATE.ACTIVE;
        _ETContract.approve(_seller, _sellerAdvanceFee);
        _ETContract.transfer(_seller, _sellerAdvanceFee);
        _eventPaymentAmount = _eventPaymentAmount.sub(_sellerAdvanceFee);
      }
  }

  function getBuyerActivationAmount() public view returns (uint){
      return _escrows[_buyer].add(_eventPaymentAmount).add(_eventProtocolCharges).add(_contributionPoolAmounts[_buyer]);
  }

  function getSellerActivationAmount() public view returns (uint){
      return _escrows[_seller].add(_contributionPoolAmounts[_seller]).add(_sellerCancellationPenalty);
  }

  function submitPostponeRequest(uint newEventDate) public onlyBuyerAndSeller returns (bool){
      require(_noOfAllowedPostponements >0);
      _postPoneRequest[newEventDate][msg.sender] = true;
      _eventState = EVENTSTATE.POSTPONEMENT;
      postPoneEvent(newEventDate);
  }

  function postPoneEvent(uint newEventDate) internal returns (bool){
      require(_postPoneRequest[newEventDate][_buyer] == true);
      require(_postPoneRequest[newEventDate][_seller] == true);
      _eventDate = newEventDate;
      _noOfAllowedPostponements--;
      require(_noOfAllowedPostponements >0);
      _eventState = EVENTSTATE.ACTIVE;
      return true;
  }

  function submitResolveRequest(uint8 val) public onlyBuyerAndSeller returns (bool){
      if (val == 2 && _eventDate > now){
        _cancellingParty = msg.sender;
        _eventState = EVENTSTATE.CANCELLATION;
      }
      else{
        _eventState = EVENTSTATE.REPORTING;
      }
      _resolveEvent[msg.sender] = val;
      return true;
  }

  function acknowledgeCancelRequest() public onlyBuyerAndSeller returns (bool){
      require(_eventState == EVENTSTATE.CANCELLATION);
      require(_eventDate > now);
      _resolveEvent[msg.sender] = 2;
      cancelEvent();
  }

  function cancelEvent() internal returns (bool){
      require(_resolveEvent[_buyer] == 2);
      require(_resolveEvent[_seller] == 2);

      // If buyer cancels the event, the advance payment will be vested with the seller
      if (_cancellingParty == _buyer){
        uint _sellerCharges = _escrows[_seller].add(_contributionPoolAmounts[_seller]).add(_sellerCancellationPenalty);
        uint _buyerCharges = _eventPaymentAmount.add(_escrows[_buyer]).add(_contributionPoolAmounts[_buyer]);
        payout(_eventProtocolCharges, _buyerCharges, _sellerCharges);
      }

      // If seller cancels the event, the cancellation fees will be p0aid back and advance may be paid back
      else{
        uint _securityDepositSeller = _ETContract.allowance(_seller, address(this));
        if (_sellerAdvanceFee > _escrows[_seller]){
          uint _delta = _sellerAdvanceFee.sub(_escrows[_seller]);
          payout(_eventProtocolCharges, _escrows[_seller].add(_sellerCancellationPenalty).add(_eventPaymentAmount).add(_contributionPoolAmounts[_buyer]), _contributionPoolAmounts[_seller]);

          if (_delta < _securityDepositSeller){
            _ETContract.transferFrom(_seller, _buyer, _delta);
          }
          //Security deposit has to be greater than 0
          else if (_securityDepositSeller > 0){
            _ETContract.transferFrom(_seller, _buyer, _securityDepositSeller);
          }

        }
        else{
          _escrows[_seller] = _escrows[_seller].sub(_sellerAdvanceFee);
          payout(_eventProtocolCharges, _sellerAdvanceFee.add(_sellerCancellationPenalty).add(_contributionPoolAmounts[_buyer]), _escrows[_seller].add(_contributionPoolAmounts[_seller]));
        }
      }

      _eventState = EVENTSTATE.SETTLED;
      return true;
  }

  function completeResolve(uint8 val) public onlyBuyerAndSeller returns (bool){
      require(_eventState == EVENTSTATE.REPORTING);
      require(now > _eventDate);
      _resolveEvent[msg.sender] = val;

      //Check if DISPUTED
      if (_resolveEvent[_buyer] == _resolveEvent[_seller]){
        if (_resolveEvent[_buyer] == 1){
          resolveContract();
        }
        else{
          cancelEvent();
        }
        return true;
      }
      _eventState = EVENTSTATE.DISPUTED;
      return false;

  }


  function resolveContract() internal returns (bool){
      //Pay balance to buyer (and the escrow amount if any)
      uint _sellerCharges = _eventPaymentAmount.add(_escrows[_seller]).add(_contributionPoolAmounts[_seller]).add(_sellerCancellationPenalty);
      uint _buyerCharges = _escrows[_buyer].add(_contributionPoolAmounts[_buyer]);
      payout(_eventProtocolCharges, _buyerCharges, _sellerCharges);
      _eventState = EVENTSTATE.SETTLED;
      return true;
  }

  function addContributers(address contributor) public onlyBuyerAndSeller returns (bool){
      require(_eventState == EVENTSTATE.ACTIVE);
      require(_contributionPoolAmounts[msg.sender] > 0);
      _isContributor[msg.sender][contributor] = true;
      if (msg.sender == _buyer){
        _contributerAddressesBuyer.push(contributor);
        return true;
      }
      _contributerAddressesSeller.push(contributor);
      return true;
  }

  function acknowledgeContributors(address contributor, uint256 _tokens) public onlyBuyerAndSeller returns (bool){
      require(_eventState != EVENTSTATE.NOTACTIVE || _eventState != EVENTSTATE.POSTPONEMENT || _eventState != EVENTSTATE.SETTLED);
      require(_contributionPoolAmounts[msg.sender] >= _tokens);
      require(_isContributor[msg.sender][contributor] == true);
      _contributersAcknowledgement[msg.sender][contributor] = _contributersAcknowledgement[msg.sender][contributor].add(_tokens);
      _contributionPoolAmounts[msg.sender] = _contributionPoolAmounts[msg.sender].sub(_tokens);
      return true;
  }

  function payOutContributors(address _target) internal returns (bool){
      address _beneficier;
      uint _val;
      if (_target == _buyer){
        for (uint i = 0; i< _contributerAddressesBuyer.length; i++){
           _beneficier = _contributerAddressesBuyer[i];
           _val = _contributersAcknowledgement[_target][_beneficier];
           if (_val > 0){
             _ETContract.approve(_beneficier, _val);
             _ETContract.transfer(_beneficier, _val);
           }
        }
      }

      else{
        for (i = 0; i< _contributerAddressesBuyer.length; i++){
          _beneficier = _contributerAddressesSeller[i];
          _val = _contributersAcknowledgement[_target][_beneficier];
          if (_val > 0){
            _ETContract.approve(_beneficier, _val);
            _ETContract.transfer(_beneficier, _val);
          }
        }
      }
      return true;
  }


  function payout(uint256 eventProtocolCharges, uint256 buyerAmount, uint256 sellerAmount) internal returns (bool){
      payOutContributors(_buyer);
      payOutContributors(_seller);

      _ETContract.approve(_eventProtocolAddress, eventProtocolCharges);
      _ETContract.transfer(_eventProtocolAddress, eventProtocolCharges);

      if (buyerAmount > 0){
        _ETContract.approve(_buyer, buyerAmount);
        _ETContract.transfer(_buyer, buyerAmount);
      }

      if (sellerAmount > 0){
        _ETContract.approve(_seller, sellerAmount);
        _ETContract.transfer(_seller, sellerAmount);
      }
      return true;
  }


  function addArbiters(address arbiter, uint val) public returns (bool){
      if (val == _resolveEvent[_buyer]){
        _arbiterAddressesBuyer.push(arbiter);
      }
      else{
        _arbiterAddressesSeller.push(arbiter);
      }
      if (_arbiterAddressesSeller.length.add(_arbiterAddressesSeller.length) == 5){
        if (_arbiterAddressesBuyer.length > _arbiterAddressesSeller.length){
            // Buyer wins here (So advance, 50% of escrow of seller and cancellation fees for buyer rewarded)
            uint _securityDepositSeller = getSellerSecurityDeposit();
            uint arbiterCharges = SafeMath.div(_escrows[_seller], _arbiterAddressesBuyer.length);
            uint _sellerEscrowHalf = SafeMath.div(_escrows[_seller], 2);

            if (_sellerAdvanceFee > _sellerEscrowHalf){
              uint _delta = _sellerAdvanceFee.sub(_sellerEscrowHalf);
              payout(_eventProtocolCharges, _sellerEscrowHalf.add(_sellerCancellationPenalty).add(_contributionPoolAmounts[_buyer]), _contributionPoolAmounts[_seller]);

              if (_delta < _securityDepositSeller){
                _ETContract.transferFrom(_seller, _buyer, _delta);
              }
              else{
                _ETContract.transferFrom(_seller, _buyer, _securityDepositSeller);
              }
            }
            else{
              _escrows[_seller] = _escrows[_seller].sub(_sellerAdvanceFee).sub(_sellerEscrowHalf);
              payout(_eventProtocolCharges, _sellerAdvanceFee.add(_sellerCancellationPenalty).add(_sellerEscrowHalf).add(_contributionPoolAmounts[_buyer]), _escrows[_seller].add(_contributionPoolAmounts[_seller]));
            }

            for (uint i = 0; i< _arbiterAddressesSeller.length; i++){
              _ETContract.approve(_arbiterAddressesSeller[i], arbiterCharges);
              _ETContract.transfer(_arbiterAddressesSeller[i], arbiterCharges);
            }

        }
        else{
          // Seller wins (So 50% of escrow and advance is kept by the seller)
          uint sellerCharges = SafeMath.div(_escrows[_buyer], 2).add(_contributionPoolAmounts[_seller].add(_escrows[_seller]));
          uint buyerCharges = _eventPaymentAmount.add(_contributionPoolAmounts[_buyer]);
          arbiterCharges = SafeMath.div(_escrows[_buyer], _arbiterAddressesSeller.length);
          for ( i = 0; i< _arbiterAddressesSeller.length; i++){
            _ETContract.approve(_arbiterAddressesSeller[i], arbiterCharges);
            _ETContract.transfer(_arbiterAddressesSeller[i], arbiterCharges);
          }
          payout(_eventProtocolCharges, buyerCharges, sellerCharges);
          return true;
        }
      }
  }

  function getEventState() public view returns (EVENTSTATE){
      return _eventState;
  }

  function getBuyer() public view returns (address){
      return _buyer;
  }

  function getSeller() public view returns (address){
      return _seller;
  }

  function getEventDate() public view returns (uint){
      return _eventDate;
  }

  function getEventName() public view returns (string){
      return _eventName;
  }

  function getEventLocation() public view returns (string){
      return _eventLocation;
  }

  function getSellerAdvanceFee() public view returns (uint){
      return _sellerAdvanceFee;
  }

  function getsellerCancellationPenalty() public view returns (uint){
      return _sellerCancellationPenalty;
  }

  function getEventCreationDate() public view returns (uint){
      return _eventCreationDate;
  }

  function getEventProtocolAddress() public view returns (address){
      return _eventProtocolAddress;
  }

  function getEventProtocolCharges() public view returns (uint){
      return _eventProtocolCharges;
  }

  function getEventPaymentCharges() public view returns (uint){
      return _eventProtocolCharges.add(_eventPaymentAmount);
  }

  function getContributionPoolAmounts(address addr) public view returns (uint){
      require(addr == _buyer || addr == _seller);
      return _contributionPoolAmounts[addr];
  }

  function getContributionAmounts(address target, address contributor) public view returns (uint){
      return _contributersAcknowledgement[target][contributor];
  }

  function getContributorPoolSize(address target) public view returns (uint){
      require(target == _buyer || target == _seller);
      if (target == _buyer){
        return _contributerAddressesBuyer.length;
      }
      return _contributerAddressesSeller.length;
  }

  function getEscrowAmounts(address addr) public view returns (uint){
      require(addr == _buyer || addr == _seller);
      return _escrows[addr];
  }

  function getTokenAddress() public view returns (address){
      return address(_ETContract);
  }

  function getSellerSecurityDeposit() public view returns (uint){
      return _ETContract.allowance(_seller, address(this));
  }

  function isContributor(address target, address contributor) public view returns (bool){
      return _isContributor[target][contributor];
  }

  function checkEventCompletion() public returns (bool){
      require(now > _eventDate && _eventState == EVENTSTATE.ACTIVE);
      _eventState = EVENTSTATE.REPORTING;
      return true;
  }

  function testThis() public view returns (bool){
      return now > _eventDate;
  }

  function testNew() public view returns (uint){
      return now;
  }



}
