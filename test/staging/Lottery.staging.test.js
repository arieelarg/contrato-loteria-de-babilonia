const { assert, expect } = require("chai")
const { network, ethers, waffle } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

const isChainDEV = developmentChains.includes(network.name)

const { formatEther } = ethers.utils

isChainDEV
    ? describe.skip
    : describe("Lottery Staging Tests", () => {
          let lottery, ticketPrice, deployer

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              lottery = await ethers.getContract("Lottery", deployer)
              ticketPrice = await lottery.getTicketPrice()
          })

          // Lottery methods being tested
          const buyTicket = (value = ticketPrice) => lottery.buyTicket({ value })
          const getBalance = (address) => waffle.provider.getBalance(address)
          const getRandomWinner = (gasLimit = 500000) => lottery.getRandomWinner({ gasLimit })
          const getNumberOfPlayers = () => lottery.getNumberOfPlayers()
          const getLotteryStatus = () => lottery.callStatic.getLotteryStatus()
          const getWinner = () => lottery.getWinner()
          const getPrize = () => lottery.getPrize()
          const getTicketPrice = () => lottery.getTicketPrice()
          //   const getPlayers = () => lottery.getPlayers()

          describe("fulfillRandomWords", () => {
              it("picks a winner, resets, and sends money", async () => {
                  let playersOnline = (await getNumberOfPlayers()).toString()

                  console.log("Players before:", Number(playersOnline))

                  if (Number(playersOnline) < 5) {
                      console.log("Buying tickets...")
                      await buyTicket()
                      await buyTicket()
                      await buyTicket()
                      await buyTicket()
                      await buyTicket()
                      await buyTicket()
                      await buyTicket()

                      playersOnline = (await getNumberOfPlayers()).toString()
                  }

                  console.log("Players after:", Number(playersOnline))

                  // Get winner balance before token transfer
                  const winnerStartingBalance = await getBalance(deployer)
                  console.log("Winner starting balance:", formatEther(winnerStartingBalance))

                  // LotteryStatus should be OPEN
                  assert.equal(await getLotteryStatus(), "0")

                  // Requesting random winner
                  console.log("Requesting random winner...")
                  const raffleLottery = await getRandomWinner()
                  //   console.log("raffleLottery", raffleLottery)

                  const performRaffle = await raffleLottery.wait()
                  console.log("performRaffle", performRaffle)

                  // LotteryStatus should be CALCULATING
                  assert.equal(await getLotteryStatus(), "1")

                  // While CALCULATING random winner should emit RequestedWinner event
                  await expect(performRaffle).to.emit(lottery, "RequestedWinner")

                  // Get prize
                  const prize = await getPrize()
                  console.log("Prize:", formatEther(prize))

                  const calculatedPrize =
                      ((await getTicketPrice()) * Number(playersOnline) * 75) / 100

                  assert.equal(prize.toString(), calculatedPrize.toString())

                  // Get all players online
                  //   const onlineAddresses = await getPlayers()
                  //   console.log("onlineAddresses", onlineAddresses)

                  // Check winner
                  const winner = await getWinner()
                  console.log("winner:", winner)
                  assert.equal(winner, deployer)

                  // Wait for WinnerPicked event to emit
                  //   await expect(vrfCoordinatorV2Request)
                  //       .to.emit(lottery, "WinnerPicked")
                  //       .withArgs(winner.address)

                  //   await expect(vrfCoordinatorV2Request)
                  //       .to.emit(lottery, "PrizeTransfered")
                  //       .withArgs(winner.address, prize)

                  // Winner balance should update with prize
                  const winnerBalance = await getBalance(winner.address)

                  assert.equal(
                      winnerBalance.toString(),
                      winnerStartingBalance.add(prize).toString()
                  )

                  // Lottery should reset
                  assert.equal(await getNumberOfPlayers(), "0")

                  // LotteryStatus should be OPEN again
                  assert.equal(await getLotteryStatus(), "0")
              })
          })
      })
