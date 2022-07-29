// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

error Lottery__SendMoreETHToEnterLottery();
error Lottery__NotEnoughPlayersToShowAmount();
error Lottery__NotEnoughPlayersToPickWinner();
error Lottery__TransferFailed();
error Lottery__AlreadyEmpty();

contract Lottery is VRFConsumerBaseV2, Ownable {
    // Chainlink VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private immutable i_callbackGasLimit;
    uint32 private constant NUM_WORDS = 1;

    // Variables
    uint256 private immutable i_ticketPrice;
    uint256 private immutable i_playersRequired;
    address payable[] private s_players;
    address private s_recentWinner;

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
        i_ticketPrice = ticketPrice;
        i_playersRequired = playersRequired;

        // Chainlink VRF variables
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
    }

    function buyTicket() public payable {
        if (msg.value < i_ticketPrice) {
            revert Lottery__SendMoreETHToEnterLottery();
        }

        s_players.push(payable(msg.sender));
        emit EnterLottery(msg.sender);
    }

    function getRandomWinner() external onlyOwner {
        if (getPlayersCount() > i_playersRequired) {
            revert Lottery__NotEnoughPlayersToPickWinner();
        }

        uint256 winnerId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        address payable recentWinner = s_players[winnerId];
        s_recentWinner = recentWinner;

        emit RequestedWinner(winnerId);

        uint256 prizeAmount = getPrizeAmount();

        (bool success, ) = recentWinner.call{value: prizeAmount}("");

        if (!success) {
            revert Lottery__TransferFailed();
        }

        emit WinnerPicked(recentWinner);

        resetLottery();
    }

    function fulfillRandomWords(
        uint256, /*requestId*/
        uint256[] memory randomWords
    ) internal override {}

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function resetLottery() private {
        if (getPlayersCount() <= 0) {
            revert Lottery__AlreadyEmpty();
        }

        delete s_players;
    }

    function getPrizeAmount() public view returns (uint256) {
        if (getPlayersCount() <= 0) {
            revert Lottery__NotEnoughPlayersToShowAmount();
        }

        return (address(this).balance * 75) / 100;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getPlayersCount() public view returns (uint256) {
        return s_players.length;
    }
}
