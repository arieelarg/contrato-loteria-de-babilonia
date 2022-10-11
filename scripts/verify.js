const { ethers, network } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

const chainId = network.config.chainId
const config = networkConfig[chainId]

async function verifyLottery() {
    const { address } = await ethers.getContract("Lottery")

    const {
        vrfCoordinatorV2,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        ticketPrice,
        playersRequired,
    } = config

    const constructorArguments = [
        vrfCoordinatorV2,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        ticketPrice,
        playersRequired,
    ]

    await verify({ address, constructorArguments })
}

verifyLottery()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
