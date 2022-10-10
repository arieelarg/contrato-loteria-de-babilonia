// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// List of errors
error sendMoreETHToEnterLottery(uint256 amount);
error notEnoughPlayersToPickWinner(uint256 playersCount, uint256 playersRequired);
error transferFailed();
error alreadyEmpty();
error notOpen();
error noWinnerPresent();

/** @title Loteria de Babilonia */
contract Lottery is VRFConsumerBaseV2 {
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
    uint256 private immutable i_ticketPrice;
    uint256 private immutable i_playersRequired;
    address payable[] private s_players;
    address private s_winner;
    LotteryStatus private s_lotteryStatus;

    // Events
    event RequestedWinner(uint256 indexed requestId);
    event RequestingWinner();
    event EnterLottery();
    event WinnerPicked(address indexed player);
    event PrizeTransfered(address winner, uint256 prize);

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
        i_playersRequired = playersRequired;
        s_lotteryStatus = LotteryStatus.OPEN;

        // Chainlink VRF variables
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
    }

    function buyTicket() public payable {
        if (msg.value < i_ticketPrice) {
            revert sendMoreETHToEnterLottery(msg.value);
        }

        if (s_lotteryStatus != LotteryStatus.OPEN) {
            revert notOpen();
        }

        s_players.push(payable(msg.sender));

        emit EnterLottery();
    }

    // @audit-it why is this public? i think it will be better if this were onlyOwner
    function getRandomWinner() external {
        if (s_players.length < i_playersRequired) {
            revert notEnoughPlayersToPickWinner(s_players.length, i_playersRequired);
        }

        if (s_lotteryStatus != LotteryStatus.OPEN) {
            revert notOpen();
        }

        s_lotteryStatus = LotteryStatus.CALCULATING;

        // @audit-it Do I need to create a fallback to prevent getting lottery stuck in status == CALCULATING?
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        emit RequestedWinner(requestId);
    }

    function fulfillRandomWords(
        uint256, /*requestId*/
        uint256[] memory randomWords
    ) internal override {
        emit RequestingWinner();

        uint256 winnerIndex = randomWords[0] % s_players.length;

        s_winner = s_players[winnerIndex];

        emit WinnerPicked(s_winner);

        uint256 prize = getPrize();

        (bool success, ) = s_winner.call{value: prize}(""); // @audit-it Replace with transfer() to prevent reentrancy attack

        if (!success) {
            revert transferFailed();
        }

        emit PrizeTransfered(s_winner, prize);

        resetLottery();

        s_lotteryStatus = LotteryStatus.OPEN;
    }

    function resetLottery() internal {
        if (s_players.length <= 0) {
            revert alreadyEmpty();
        }

        s_players = new address payable[](0);
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
        return i_playersRequired;
    }

    function getPlayers() public view returns (address payable[] memory) {
        return s_players;
    }
}
