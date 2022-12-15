// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// List of errors
error sendMoreETHToBuyTicket(uint256 amount);
error notEnoughPlayersToPickWinner(uint256 playersCount, uint256 playersRequired);
error transferFailed();
error alreadyEmpty();
error notOpen();
error noWinnerPresent();
error illegalTicketPrice();

/** @title Loteria de Babilonia */
contract Lottery is VRFConsumerBaseV2, Ownable {
    /* Type declarations */
    enum LotteryStatus {
        OPEN,
        CALCULATING
    }

    // Chainlink VRF variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private immutable i_callbackGasLimit;
    uint32 private constant NUM_WORDS = 1;

    // Lottery variables
    using SafeMath for uint256;
    uint256 private i_ticketPrice;
    uint256 private s_playersRequired;
    address payable[] private s_players;
    address private s_winner;
    LotteryStatus private s_lotteryStatus;

    // Events
    event StartLottery(uint256 price, LotteryStatus lotteryStatus, uint256 playersRequired);
    event RestartLottery(LotteryStatus lotteryStatus, address payable[] s_players);
    event BuyTicket(uint256 prize, address from);
    event LotteryCalculating(LotteryStatus lotteryStatus);
    event RandomWords(uint256 requestId, uint256[] randomWords);
    event WinnerPicked(address indexed player);
    event PrizeTransfered(address winner);
    event PrizeToTransfer(uint256 prize);
    event UpdatePlayersRequired(uint256 playersRequired);
    event TicketPriceUpdated(uint256 ticketPrice);

    constructor(
        address vrfCoordinatorV2,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 ticketPrice,
        uint256 playersRequired
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        // Lottery variables
        i_ticketPrice = ticketPrice;
        s_playersRequired = playersRequired;
        s_lotteryStatus = LotteryStatus.OPEN;

        // Chainlink VRF variables
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;

        startLottery(ticketPrice, playersRequired);
    }

    function startLottery(uint256 ticketPrice, uint256 playersRequired) internal {
        // uint256 price, LotteryStatus lotteryStatus, uint256 playersRequired
        emit StartLottery(ticketPrice, LotteryStatus.OPEN, playersRequired);
    }

    function buyTicket() public payable {
        if (msg.value < i_ticketPrice) {
            revert sendMoreETHToBuyTicket(msg.value);
        }

        if (s_lotteryStatus != LotteryStatus.OPEN) {
            revert notOpen();
        }

        s_players.push(payable(msg.sender));

        emit BuyTicket(msg.value, msg.sender);
    }

    function getRandomWinner() public onlyOwner {
        if (s_players.length < s_playersRequired) {
            revert notEnoughPlayersToPickWinner(s_players.length, s_playersRequired);
        }

        if (s_lotteryStatus != LotteryStatus.OPEN) {
            revert notOpen();
        }

        s_lotteryStatus = LotteryStatus.CALCULATING;

        emit LotteryCalculating(s_lotteryStatus);

        // @audit-it Do I need to create a fallback to prevent getting lottery stuck in status == CALCULATING?
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        setWinner(requestId);

        transferPrize();

        restartLottery();
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        emit RandomWords(requestId, randomWords);
    }

    function setWinner(uint256 requestId) internal {
        if (requestId < 0) {
            revert transferFailed();
        }

        uint256 winnerIndex = requestId % s_players.length;

        s_winner = s_players[winnerIndex];

        emit WinnerPicked(s_winner);
    }

    function transferPrize() public onlyOwner {
        uint256 prize = getPrize();

        emit PrizeToTransfer(prize);

        if (prize <= 0) {
            revert transferFailed();
        }

        if(s_winner == address(0)) {
            revert noWinnerPresent();
        }

        (bool success, ) = s_winner.call{value: prize}(""); // @audit-it Replace with transfer() to prevent reentrancy attack

        if (!success) {
            revert transferFailed();
        }

        emit PrizeTransfered(s_winner);
    }

    function restartLottery() internal {
        if (s_players.length <= 0) {
            revert alreadyEmpty();
        }

        s_players = new address payable[](0);

        s_lotteryStatus = LotteryStatus.OPEN;

        emit RestartLottery(LotteryStatus.OPEN, s_players);
    }

    /** Setters */
    function setTicketPrice(uint256 ticketPrice) public onlyOwner {
        if(ticketPrice <= 0){
            revert illegalTicketPrice();
        }

        i_ticketPrice = ticketPrice;

        emit TicketPriceUpdated(i_ticketPrice);
    }

    function setPlayersRquired(uint256 playersRequired) public onlyOwner {
        s_playersRequired = playersRequired;

        emit UpdatePlayersRequired(playersRequired);
    }

    /** Getters */
    function getPrize() public view returns (uint256) {
        if (s_players.length > 0) {
            uint256 balance = address(this).balance;

            return balance.mul(75).div(100);
        }

        return 0;
    }

    function getWinner() public view returns (address) {
        return s_winner;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLotteryStatus() public view returns (LotteryStatus) {
        return s_lotteryStatus;
    }

    function getTicketPrice() public view returns (uint256) {
        return i_ticketPrice;
    }

    function getPlayersRequired() public view returns (uint256) {
        return s_playersRequired;
    }

    function getPlayers() public view returns (address payable[] memory) {
        return s_players;
    }
}
