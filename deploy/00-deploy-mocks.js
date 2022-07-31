const { getNamedAccounts, deployments, network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

const BASE_FEE = ethers.utils.parseEther("0.25") // 0.25 ether
const GAS_PRICE_LINK = 1e9 // 0.000000001 LINK per gas

module.exports = async () => {
    const { deploy, log } = deployments
    const { deployer: from } = await getNamedAccounts()
    const args = [BASE_FEE, GAS_PRICE_LINK]

    // If we are on a local development network, we need to deploy mocks!
    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...")

        await deploy("VRFCoordinatorV2Mock", {
            from,
            log: true,
            args,
        })

        log("Mocks Deployed!")
        log("----------------------------------------------------------")
        log("You are deploying to a local network, you'll need a local network running to interact")
        log("Please run `npm run deploy:local` to interact with the deployed smart contracts!")
        log("----------------------------------------------------------")
    }
}
module.exports.tags = ["all", "mocks"]
