require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-contract-sizer")
require("dotenv").config()

const { chains } = require("./helper-hardhat-config")

const WALLET_PRIVATE_KEY = [process.env.WALLET_PRIVATE_KEY]

const PROD_ETHERSCAN_API_KEY = process.env.PROD_ETHERSCAN_API_KEY
const TEST_ETHERSCAN_API_KEY = process.env.TEST_ETHERSCAN_API_KEY

const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL
const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL

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
            url: GOERLI_RPC_URL,
            accounts: WALLET_PRIVATE_KEY,
        },
        mainnet: {
            chainId: chains.mainnet,
            url: MAINNET_RPC_URL,
            accounts: WALLET_PRIVATE_KEY,
        },
    },
    etherscan: {
        apiKey: {
            goerli: TEST_ETHERSCAN_API_KEY,
            mainnet: PROD_ETHERSCAN_API_KEY,
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
