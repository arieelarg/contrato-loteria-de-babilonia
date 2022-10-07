require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-contract-sizer")
require("dotenv").config()

const { chains } = require("./helper-hardhat-config")

const ALCHEMY_PRIVATE_KEY = [process.env.ALCHEMY_PRIVATE_KEY]

const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL
const MAINNET_ETHERSCAN_API_KEY = process.env.MAINNET_ETHERSCAN_API_KEY

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL
const GOERLI_ETHERSCAN_API_KEY = process.env.GOERLI_ETHERSCAN_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.9",
    networks: {
        localhost: {
            chainId: chains.localhost,
            blockConfirmations: 1,
        },
        goerli: {
            chainId: chains.goerli,
            blockConfirmations: 6,
            url: GOERLI_RPC_URL,
            accounts: ALCHEMY_PRIVATE_KEY,
        },
        mainnet: {
            chainId: chains.mainnet,
            url: MAINNET_RPC_URL,
            accounts: ALCHEMY_PRIVATE_KEY,
        },
    },
    etherscan: {
        apiKey: {
            goerli: GOERLI_ETHERSCAN_API_KEY,
            mainnet: MAINNET_ETHERSCAN_API_KEY,
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
}
