const chains = {
    localhost: 31337,
    goerli: 5,
    mainnet: 1,
}

const networkConfig = {
    default: {
        name: "hardhat",
    },
    [chains.localhost]: {
        name: "localhost",

        verfCoordinatorV2: "0x5fbdb2315678afecb367f032d93f642f64180aa3", // Lo obtengo al ejecutar `yarn run deploy:mocks` y no cambia
        subscriptionId: "588", // (Chainlink VRF)
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // s_keyHash only for rinkeby testnet (Chainlink VRF)
        callbackGasLimit: "500000", // (Chainlink VRF)

        ticketPrice: "100000000000000", // 0.0001 ether
        playersRequired: 2,
    },
    [chains.goerli]: {
        name: "goerli",

        vrfCoordinatorV2: "0x2ca8e0c643bde4c2e08ab1fa0da3401adad7734d", // (Chainlink VRF)
        subscriptionId: "3614", // (Chainlink VRF)
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15", // s_keyHash only for goerli testnet (Chainlink VRF)
        callbackGasLimit: "500000", // (Chainlink VRF)

        ticketPrice: "100000000000000", // 0.0001 ether
        playersRequired: 5,
    },
    [chains.mainnet]: {
        name: "mainnet",

        vrfCoordinatorV2: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
        subscriptionId: "404",
        gasLane: "0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef",
        callbackGasLimit: "200000",

        ticketPrice: "100000000000000", // 0.0001 ether
        playersRequired: 2,
    },
}

const developmentChains = ["hardhat", "localhost"]
const VERIFICATION_BLOCK_CONFIRMATIONS = 3

module.exports = {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    chains,
}
