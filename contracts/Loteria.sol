// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Lottery is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    address public owner;

    uint256 private seed;

    constructor() ERC721 ("BABILONIA", "BBL") {
        owner = msg.sender;

        seed = (block.timestamp + block.difficulty) % 100;
    }

    uint ticketPrice = 0.0001 ether;

    uint playersRequired = 1;

    string base_url_token_uri = "https://gateway.pinata.cloud/ipfs/";

    address[] participants;

    modifier onlyOwner {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    function mint(string memory tokenURI) public returns (uint256) {
        uint256 newItemId = _tokenIds.current();
        _safeMint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        _tokenIds.increment();
        return newItemId;
    }

        // https://gateway.pinata.cloud/ipfs/QmckcPnetubtJ1MqbTbCWaZQGVTNVGoCPNs6dppRRP9YMe

    function buyTicket() public payable returns (uint256) {
        require(msg.value == ticketPrice, "Must pay 1USD");

        uint256 newTicket;

        participants.push(msg.sender);

        // newTicket = mint(string.concat(base_url_token_uri, Strings.toString(getParticipantsCount())));

        newTicket = mint("https://gateway.pinata.cloud/ipfs/QmckcPnetubtJ1MqbTbCWaZQGVTNVGoCPNs6dppRRP9YMe");

        return newTicket;

    }

    function getParticipantsCount() public view returns (uint count){
        return participants.length;
    }

    function getWinner() public onlyOwner returns (address winner) {
        require(getParticipantsCount() > playersRequired, "There isn't enough players yet");

        uint index = seed % getParticipantsCount();


        uint256 prizeAmount = address(this).balance;

        require(
            prizeAmount <= address(this).balance,
            "Trying to withdraw more money than the contract has."
        );

        (bool success, ) = (participants[index]).call{value: prizeAmount}("");

        require(success, "Failed to withdraw money from contract.");
    }

    function resetLottery() public onlyOwner {
        
    }
    
}