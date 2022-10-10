const { assert, expect } = require("chai")
const { network, deployments, ethers, waffle } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

const isChainDEV = developmentChains.includes(network.name)

!isChainDEV
    ? describe.skip
    : describe("Lottery Unit Tests", () => {
          let lottery, vrfCoordinatorV2Mock, ticketPrice, winner, player, lotteryContract
          const { chainId } = network.config
          const config = networkConfig[chainId]

          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              player = accounts[1]
              winner = accounts[2] // We will always get the same result

              await deployments.fixture(["mocks", "lottery"])

              lotteryContract = await ethers.getContract("Lottery")
              lottery = await lotteryContract.connect(player)

              ticketPrice = await lottery.getTicketPrice()
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
          })

          // Lottery methods being tested
          const buyTicket = (value = ticketPrice) => lottery.buyTicket({ value })
          const getBalance = (address) => waffle.provider.getBalance(address)
          const getRandomWinner = (gasLimit = 100000) => lottery.getRandomWinner({ gasLimit })
          const getNumberOfPlayers = () => lottery.getNumberOfPlayers()
          const getLotteryStatus = () => lottery.getLotteryStatus()
          const getWinner = () => lottery.getWinner()
          const getPrize = () => lottery.getPrize()
          const getTicketPrice = () => lottery.getTicketPrice()

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
                  await expect(buyTicket(0)).to.be.revertedWith("sendMoreETHToEnterLottery")
              })

              it("record players when they enter", async () => {
                  await buyTicket()
                  const contractPlayer = await lottery.getPlayer(0)
                  assert.equal(player.address, contractPlayer)
              })

              it("emits event when enter lottery", async () => {
                  await expect(buyTicket()).to.emit(lottery, "EnterLottery")
              })
          })

          describe("fulfillRandomWords", () => {
              beforeEach(async () => {
                  await buyTicket()
              })

              it("picks a winner, resets, and sends money", async () => {
                  const player2 = lotteryContract.connect(winner)
                  await player2.buyTicket({ value: ticketPrice })

                  // Get winner balance before token transfer
                  const winnerStartingBalance = await getBalance(winner.address)

                  // LotteryStatus should be OPEN
                  assert.equal(await getLotteryStatus(), "0")

                  // Requesting random winner
                  console.log("Requesting winner...")
                  const txLottery = await getRandomWinner()
                  const txReceipt = await txLottery.wait(1)

                  // LotteryStatus should be CALCULATING
                  assert.equal(await getLotteryStatus(), "1")

                  // While CALCULATING random winner should emit RequestedWinner event
                  await expect(txLottery).to.emit(lottery, "RequestedWinner")

                  // Check Prize calculation
                  const actualPrize = await getPrize()
                  const calculatedPrize = ((await getTicketPrice()) * 2 * 75) / 100
                  assert.equal(actualPrize.toString(), calculatedPrize.toString())

                  const vrfCoordinatorV2Request = await vrfCoordinatorV2Mock.fulfillRandomWords(
                      txReceipt.events[1].args.requestId,
                      lottery.address
                  )

                  //   Wait for WinnerPicked event to emit
                  await expect(vrfCoordinatorV2Request)
                      .to.emit(lottery, "WinnerPicked")
                      .withArgs(winner.address)

                  await expect(vrfCoordinatorV2Request)
                      .to.emit(lottery, "PrizeTransfered")
                      .withArgs(winner.address, actualPrize)

                  // Check winner
                  const actualWinner = await getWinner()
                  assert.equal(actualWinner, winner.address)

                  // Winner balance should update with prize
                  const winnerBalance = await getBalance(winner.address)

                  assert.equal(
                      winnerBalance.toString(),
                      winnerStartingBalance.add(actualPrize).toString()
                  )

                  // Lottery should reset
                  assert.equal(await getNumberOfPlayers(), "0")

                  // LotteryStatus should be OPEN again
                  assert.equal(await getLotteryStatus(), "0")
              })
          })
      })
