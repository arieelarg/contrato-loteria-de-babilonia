const { ethers } = require("hardhat")

async function enterLottery() {
    const lottery = await ethers.getContract("Lottery")
    const ticketPrice = await lottery.getTicketPrice()
    await lottery.buyTicket({ value: ticketPrice + 1 })
    console.log("Entered!")
}

enterLottery()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
