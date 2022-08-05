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
    4: {
        name: "rinkeby",

        subscriptionId: "9967", // (Chainlink VRF)
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // s_keyHash only for rinkeby testnet (Chainlink VRF)
        callbackGasLimit: "500000", // (Chainlink VRF)
        vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab", // (Chainlink VRF)

        ticketPrice: "100000000000000", // 0.0001 ether
        playersRequired: 5,
    },
    1: {
        name: "mainnet",
    },
}

const developmentChains = ["hardhat", "localhost"]
const VERIFICATION_BLOCK_CONFIRMATIONS = 6
const frontEndContractsFile = "../nextjs-smartcontract-lottery-fcc/constants/contractAddresses.json"
const frontEndAbiFile = "../nextjs-smartcontract-lottery-fcc/constants/abi.json"

module.exports = {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    frontEndContractsFile,
    frontEndAbiFile,
}
