require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-contract-sizer")
require("dotenv").config()

const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL
const ALCHEMY_PRIVATE_KEY = [process.env.ALCHEMY_PRIVATE_KEY]
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL
const RINKEBY_ETHERSCAN_API_KEY = process.env.RINKEBY_ETHERSCAN_API_KEY
const POLYGONSCAN_ETHERSCAN_API_KEY = process.env.POLYGONSCAN_ETHERSCAN_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.9",
    networks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
        },
        rinkeby: {
            chainId: 4,
            blockConfirmations: 6,
            url: RINKEBY_RPC_URL,
            accounts: ALCHEMY_PRIVATE_KEY,
        },
        mainnet: {
            chainId: 1,
            url: MAINNET_RPC_URL,
            accounts: ALCHEMY_PRIVATE_KEY,
        },
    },
    etherscan: {
        apiKey: {
            // "verify:rinkeby": "yarn hardhat verify --network rinkeby <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>",
            rinkeby: RINKEBY_ETHERSCAN_API_KEY,
            polygon: POLYGONSCAN_ETHERSCAN_API_KEY,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0, //By default take the first account as "deployer"
            1: 0, // On mainnet it will take the first account as "deployer". Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        },
        player: {
            default: 1,
        },
    },
    mocha: {
        timeout: 2000, // 3s
    },
}
