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

const ETHER_SCAN_KEY = process.env.GOERLI_ETHERSCAN_API_KEY

async function deployLottery() {
    const { deploy } = deployments

    const { deployer: from } = await getNamedAccounts()

    const { gasLane, ticketPrice, callbackGasLimit, playersRequired } = config

    let vrfCoordinatorV2, subscriptionId

    const isChainDEV = developmentChains.includes(network.name)

    console.log("network name:", network.name)

    console.log("isChainDEV:", isChainDEV)

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
        console.log("Verifying contract...")
        await verify(lottery.address, args)
    }

    console.log("Enter lottery with command:")
    const networkName = isChainDEV ? "localhost" : network.name
    console.log(`hh run script/enter.js --network ${networkName}`)
    console.log("----------------------------------------------------")
}

deployLottery()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exitCode = 1
    })
