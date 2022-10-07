const { getNamedAccounts, deployments, network } = require("hardhat")
const {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

const FUND_AMOUNT = "1000000000000000000000"

const chainId = network.config.chainId
const networkName = network.name
const config = networkConfig[chainId]

const ETHER_SCAN_KEY = process.env.GOERLI_ETHERSCAN_API_KEY

module.exports = async () => {
    const { deploy, log } = deployments

    const { deployer: from } = await getNamedAccounts()

    log("networkName:", networkName)
    log("config:", config)

    const { gasLane, ticketPrice, callbackGasLimit, playersRequired } = config

    let vrfCoordinatorV2, subscriptionId

    const isChainDEV = developmentChains.includes(networkName)

    log("isChainDEV:", isChainDEV)

    if (isChainDEV) {
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

    // This should match constructor expected parameters order
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
        waitConfirmations: isChainDEV ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS,
    })

    // Verify the contract on Etherscan
    if (!isChainDEV && ETHER_SCAN_KEY) {
        log("Verifying contract...")
        await verify({ address: lottery.address, constructorArguments: args })
    }

    log(`Enter lottery with command: "hh run scripts/enter.js --network ${networkName}"`)
}

module.exports.tags = ["all", "lottery"]
