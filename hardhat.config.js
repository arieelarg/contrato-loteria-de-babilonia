require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.9",
    networks: {
        ropsten: {
            url: process.env.TEST_ALCHEMY_KEY,
            accounts: [process.env.PRIVATE_KEY],
        },
        mainnet: {
            chainId: 1,
            url: process.env.LIVE_ALCHEMY_KEY,
            accounts: [process.env.PRIVATE_KEY],
        },
    },
}
