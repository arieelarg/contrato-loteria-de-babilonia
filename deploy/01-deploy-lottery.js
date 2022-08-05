const { getNamedAccounts, deployments, network } = require("hardhat")
const {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

const FUND_AMOUNT = "1000000000000000000000"

const chainId = network.config.chainId
const config = networkConfig[chainId]

module.exports = async () => {
    const { deploy, log } = deployments
    const { deployer: from } = await getNamedAccounts()
    const { gasLane, ticketPrice, callbackGasLimit, playersRequired } = config
    let vrfCoordinatorV2, subscriptionId

    if (developmentChains.includes(network.name)) {
        // create VRFV2 Subscription
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2 = vrfCoordinatorV2Mock.address
        const txResponse = await vrfCoordinatorV2Mock.createSubscription()
        const txReceipt = await txResponse.wait()
        subscriptionId = txReceipt.events[0].args.subId
        // Fund the subscription
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2 = config["vrfCoordinatorV2"]
        subscriptionId = config["subscriptionId"]
    }

    const args = [
        vrfCoordinatorV2,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        ticketPrice,
        playersRequired,
    ]

    const lottery = await deploy("Lottery", {
        from,
        args,
        log: true,
        waitConfirmations: developmentChains.includes(network.name)
            ? 1
            : VERIFICATION_BLOCK_CONFIRMATIONS,
    })

    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.RINKEBY_ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(lottery.address, args)
    }

    log("Enter lottery with command:")
    const networkName = network.name == "hardhat" ? "localhost" : network.name
    log(`npm run deploy:${networkName}`)
    log("----------------------------------------------------")
}

module.exports.tags = ["all", "lottery"]
