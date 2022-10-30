const { assert, expect } = require("chai")
const { network, deployments, ethers, waffle } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { GAS_LIMIT } = require("../constants")

const isChainDEV = developmentChains.includes(network.name)

!isChainDEV
    ? describe.skip
    : describe("Lottery Unit Tests", () => {
          let owner, player, winner
          let ticketPrice
          let lottery, token

          const { chainId } = network.config
          const config = networkConfig[chainId]

          beforeEach(async () => {
              ;[owner, player, winner] = await ethers.getSigners()

              await deployments.fixture(["mocks", "lottery"])

              token = await ethers.getContract("Lottery")
              lottery = await token.connect(owner)

              ticketPrice = await lottery.getTicketPrice()
          })

          // Lottery methods being tested
          const buyTicket = (value = ticketPrice) => lottery.buyTicket({ value })
          const getBalance = (address) => waffle.provider.getBalance(address)
          const getRandomWinner = (gasLimit = GAS_LIMIT) => lottery.getRandomWinner({ gasLimit })
          const getNumberOfPlayers = () => lottery.getNumberOfPlayers()
          const getLotteryStatus = () => lottery.getLotteryStatus()
          const getWinner = () => lottery.getWinner()
          //   const getPrize = () => lottery.getPrize()
          const getTicketPrice = () => lottery.getTicketPrice()

          const getArgsFromEvent = ({ events, eventName }) => {
              let eventArgs = {}

              for (const event of events) {
                  if (event?.event === eventName) {
                      eventArgs = event.args
                  }
              }

              return eventArgs
          }

          describe("constructor", () => {
              it("initializates the lottery", async () => {
                  const lotteryStatus = await lottery.getLotteryStatus()
                  const playersRequired = await lottery.getPlayersRequired()
                  assert.equal(lotteryStatus.toString(), "0")
                  assert.equal(playersRequired.toString(), config.playersRequired)
                  // complete...
              })
          })

          describe("enterLottery", () => {
              it("reverts when not paid enough", async () => {
                  await expect(buyTicket(0)).to.be.revertedWith("sendMoreETHToBuyTicket")
              })

              it("record players when they enter", async () => {
                  await buyTicket()
                  const contractPlayer = await lottery.getPlayer(0)
                  assert.equal(owner.address, contractPlayer)
              })

              it("emits event when enter lottery", async () => {
                  await expect(buyTicket()).to.emit(lottery, "BuyTicket")
              })
          })

          describe("getRandomWinner", () => {
              beforeEach(async () => {
                  await buyTicket()
              })

              it("picks a winner, resets, and sends money", async () => {
                  const player2 = token.connect(winner)
                  await player2.buyTicket({ value: ticketPrice })

                  // Get winner balance before token transfer
                  const winnerStartingBalance = await getBalance(winner.address)

                  // LotteryStatus should be OPEN
                  assert.equal(await getLotteryStatus(), "0")

                  // Requesting random winner
                  console.log("Requesting winner")
                  const txLottery = await getRandomWinner()
                  const txReceipt = await txLottery.wait(1)

                  // LotteryStatus should be CALCULATING
                  console.log("Lottery calculating")
                  await expect(txLottery).to.emit(lottery, "LotteryCalculating")

                  console.log("Winner requested")
                  await expect(txLottery).to.emit(lottery, "WinnerRequested")

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
