const { ethers } = require("hardhat")

async function enterLottery() {
    const lottery = await ethers.getContract("Lottery")
    const ticketPrice = await lottery.getTicketPrice()
    const playersRequired = await lottery.getPlayersRequired()

    console.log("playersRequired:", playersRequired.toString())

    await lottery.buyTicket({ value: ticketPrice })
    console.log("Player 1 online!")

    await lottery.buyTicket({ value: ticketPrice })
    console.log("Player 2 online!")
}

enterLottery()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
