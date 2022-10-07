const { ethers } = require("hardhat")

async function enterLottery() {
    const lottery = await ethers.getContract("Lottery")
    const ticketPrice = await lottery.getTicketPrice()
    const playersRequired = await lottery.getTicketPrice()

    console.log("playersRequired: ", playersRequired)

    await lottery.buyTicket({ value: ticketPrice + 1 })
    console.log("Player 1 online!")

    await lottery.buyTicket({ value: ticketPrice + 1 })
    console.log("Player 2 online!")
}

enterLottery()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
