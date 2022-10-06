const networkConfig = {
    default: {
        name: "hardhat",
    },
    31337: {
        name: "localhost",

        subscriptionId: "588", // (Chainlink VRF)
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // s_keyHash only for rinkeby testnet (Chainlink VRF)
        callbackGasLimit: "500000", // (Chainlink VRF)

        ticketPrice: "100000000000000", // 0.0001 ether
        playersRequired: 2,
    },
    5: {
        name: "goerli",

        vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D", // (Chainlink VRF)
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15", // s_keyHash only for rinkeby testnet (Chainlink VRF)
        callbackGasLimit: "500000", // (Chainlink VRF)
        subscriptionId: "3614", // (Chainlink VRF)

        ticketPrice: "100000000000000", // 0.0001 ether
        playersRequired: 5,
    },
    1: {
        name: "mainnet",

        vrfCoordinatorV2: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
        subscriptionId: "404",
        gasLane: "0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef",
        callbackGasLimit: "200000",

        ticketPrice: "100000000000000", // 0.0001 ether
        playersRequired: 2,
    },
}

const developmentChains = ["hardhat", "localhost", "goerli"]
const VERIFICATION_BLOCK_CONFIRMATIONS = 3
const frontEndContractsFile = "../nextjs-smartcontract-lottery-fcc/constants/contractAddresses.json"
const frontEndAbiFile = "../nextjs-smartcontract-lottery-fcc/constants/abi.json"

module.exports = {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    frontEndContractsFile,
    frontEndAbiFile,
}
