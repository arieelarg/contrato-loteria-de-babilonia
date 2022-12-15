const { assert, expect } = require("chai")
const { network, ethers, waffle } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { GAS_LIMIT } = require("../constants")
const { getArgsFromEvent } = require("../utils")

const isChainDEV = developmentChains.includes(network.name)

const { formatEther } = ethers.utils

isChainDEV
    ? describe.skip
    : describe("Lottery Staging Tests", () => {
          let lottery, ticketPrice, deployer

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              lottery = await ethers.getContract("Lottery", deployer)
              console.log("Address", lottery.address)
              ticketPrice = await lottery.getTicketPrice()
          })

          // Lottery methods being tested
          const buyTicket = (value = ticketPrice) => lottery.buyTicket({ value })
          const getBalance = (address) => waffle.provider.getBalance(address)
          const getRandomWinner = (gasLimit = GAS_LIMIT) => lottery.getRandomWinner({ gasLimit })
          const getNumberOfPlayers = () => lottery.getNumberOfPlayers()
          const getLotteryStatus = () => lottery.callStatic.getLotteryStatus()
          const getWinner = () => lottery.getWinner()
          const getPrize = () => lottery.getPrize()
          const getTicketPrice = () => lottery.getTicketPrice()
          //   const getPlayers = () => lottery.getPlayers()

          describe("getRandomWinner", () => {
              it("picks a winner, resets, and sends money", async () => {
                  let playersOnline = (await getNumberOfPlayers()).toString()

                  console.log("Players before:", Number(playersOnline))

                  if (Number(playersOnline) < 5) {
                      console.log("Buying tickets...")
                      await (await buyTicket()).wait()
                      await (await buyTicket()).wait()
                      await (await buyTicket()).wait()
                      await (await buyTicket()).wait()
                      await (await buyTicket()).wait()
                      await (await buyTicket()).wait()
                      await (await buyTicket()).wait()

                      playersOnline = (await getNumberOfPlayers()).toString()
                  }

                  console.log("Players after:", Number(playersOnline))

                  // Get winner balance before token transfer
                  const winnerStartingBalance = await getBalance(deployer)

                  // LotteryStatus should be OPEN
                  assert.equal(await getLotteryStatus(), "0")

                  // Requesting random winner
                  console.log("Requesting winner")
                  const txLottery = await getRandomWinner()
                  const txReceipt = await txLottery.wait()

                  // LotteryStatus should be CALCULATING
                  console.log("Lottery calculating")
                  await expect(txLottery).to.emit(lottery, "LotteryCalculating")

                  console.log("Winner picked!")
                  await expect(txLottery).to.emit(lottery, "WinnerPicked")

                  console.log("Prize amount")
                  await expect(txLottery).to.emit(lottery, "PrizeToTransfer")

                  console.log("Prize transfer")
                  await expect(txLottery).to.emit(lottery, "PrizeTransfered")

                  console.log("Reset lottery")
                  await expect(txLottery).to.emit(lottery, "UpdateLottery")

                  // Check Prize calculation
                  const args = getArgsFromEvent({
                      events: txReceipt.events,
                      eventName: "PrizeToTransfer",
                  })

                  console.log("argsPrize", args.prize.toString())

                  const calculatedPrize = ((await getTicketPrice()) * 2 * 75) / 100
                  assert.equal(args?.prize?.toString(), calculatedPrize.toString())

                  // Check winner
                  const actualWinner = await getWinner()
                  console.log("actualWinner", actualWinner)
                  assert.equal(actualWinner, winner.address)

                  // Winner balance should update with prize
                  const winnerBalance = await getBalance(winner.address)

                  assert.equal(
                      winnerBalance.toString(),
                      winnerStartingBalance.add(args.prize).toString()
                  )

                  // Lottery should reset
                  assert.equal(await getNumberOfPlayers(), "0")

                  // LotteryStatus should be OPEN again
                  assert.equal(await getLotteryStatus(), "0")
              })
          })
      })
