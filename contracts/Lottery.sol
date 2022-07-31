// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "hardhat/console.sol";

// List of errors
error Lottery__SendMoreETHToEnterLottery(uint256 amount);
error Lottery__NotEnoughPlayersToShowAmount();
error Lottery__NotEnoughPlayersToPickWinner(uint256 playersCount, uint256 playersRequired);
error Lottery__TransferFailed();
error Lottery__AlreadyEmpty();
error Lottery__NotOpen();

/** @title Loteria de Babilonia */
contract Lottery is VRFConsumerBaseV2, Ownable {
    /* Type declarations */
    enum LotteryState {
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
    uint256 private immutable i_ticketPrice;
    uint256 private immutable i_playersRequired;
    address payable[] private s_players;
    address private s_lastWinner;
    LotteryState private s_lotteryState;

    // Events
    event RequestedWinner(uint256 indexed requestId);
    event EnterLottery(address indexed player);
    event WinnerPicked(address indexed player);

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
        s_lotteryState = LotteryState.OPEN;

        // Chainlink VRF variables
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
    }

    function buyTicket() public payable {
        if (msg.value < i_ticketPrice) {
            revert Lottery__SendMoreETHToEnterLottery(msg.value);
        }

        if (s_lotteryState != LotteryState.OPEN) {
            revert Lottery__NotOpen();
        }

        s_players.push(payable(msg.sender));

        emit EnterLottery(msg.sender);
    }

    function getRandomWinner() external onlyOwner {
        if (getNumberOfPlayers() < i_playersRequired) {
            revert Lottery__NotEnoughPlayersToPickWinner(getNumberOfPlayers(), i_playersRequired);
        }

        s_lotteryState = LotteryState.CALCULATING;

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
        uint256 winnerIndex = randomWords[0] % s_players.length;

        address payable lastWinner = s_players[winnerIndex];

        s_lastWinner = lastWinner;

        emit WinnerPicked(lastWinner);

        uint256 prize = getPrize();

        (bool success, ) = lastWinner.call{value: prize}("");

        if (!success) {
            revert Lottery__TransferFailed();
        }

        resetLottery();

        s_lotteryState = LotteryState.OPEN;
    }

    function resetLottery() internal {
        if (getNumberOfPlayers() <= 0) {
            revert Lottery__AlreadyEmpty();
        }

        s_players = new address payable[](0);
    }

    /** Getters */

    function getPrize() public view returns (uint256) {
        if (getNumberOfPlayers() <= 0) {
            revert Lottery__NotEnoughPlayersToShowAmount();
        }

        return (address(this).balance * 75) / 100;
    }

    function getLastWinner() public view returns (address) {
        return s_lastWinner;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLotteryState() public view returns (LotteryState) {
        return s_lotteryState;
    }

    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getTicketPrice() public view returns (uint256) {
        return i_ticketPrice;
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }

    function getPlayersRequired() public view returns (uint256) {
        return i_playersRequired;
    }

    function getPlayers() public view returns (address payable[] memory) {
        return s_players;
    }
}
