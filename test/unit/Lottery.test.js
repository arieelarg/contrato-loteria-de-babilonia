const { assert, expect } = require("chai")
const { network, deployments, ethers, waffle } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery Unit Tests", () => {
          let lottery, vrfCoordinatorV2Mock, ticketPrice, accounts, player

          const { chainId } = network.config
          const config = networkConfig[chainId]

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              player = accounts[1]

              await deployments.fixture(["mocks", "lottery"])

              lotteryContract = await ethers.getContract("Lottery")
              lottery = await lotteryContract.connect(player)

              ticketPrice = await lottery.getTicketPrice()
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
          })

          // Lottery methods being tested
          const buyTicket = (value = ticketPrice) => lottery.buyTicket({ value })
          const getBalance = (address) => waffle.provider.getBalance(address)
          const getRandomWinner = () => lottery.getRandomWinner()
          const getNumberOfPlayers = () => lottery.getNumberOfPlayers()
          const getLotteryState = () => lottery.getLotteryState()
          const getWinner = () => lottery.getWinner()
          const getPrize = () => lottery.getPrize()
          const getTicketPrice = () => lottery.getTicketPrice()

          describe("constructor", () => {
              it("initializates the lottery", async () => {
                  const lotteryState = await lottery.getLotteryState()
                  const playersRequired = await lottery.getPlayersRequired()
                  assert.equal(lotteryState.toString(), "0")
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
                  const winner = accounts[2]
                  const player2 = lotteryContract.connect(winner)
                  await player2.buyTicket({ value: ticketPrice })

                  // Get winner balance before token transfer
                  const winnerStartingBalance = await getBalance(winner.address)

                  // LotteryState should be OPEN
                  assert.equal(await getLotteryState(), "0")

                  //   // Requesting random winner
                  //   await getRandomWinner()

                  //   // LotteryState should be CALCULATING
                  //   assert.equal(await getLotteryState(), "1")

                  //   //   While CALCULATING random winner should emit RequestedWinner event
                  //   await expect(getRandomWinner()).to.emit(lottery, "RequestedWinner")

                  // Get prize
                  const prize = await getPrize()
                  assert.equal(
                      prize.toString(),
                      (((await getTicketPrice()) * 2 * 75) / 100).toString()
                  )

                  const tx = await getRandomWinner()
                  const txReceipt = await tx.wait(1)
                  const vrfCoordinatorV2Request = await vrfCoordinatorV2Mock.fulfillRandomWords(
                      txReceipt.events[1].args.requestId,
                      lottery.address
                  )

                  // Wait for WinnerPicked event to emit
                  await expect(vrfCoordinatorV2Request)
                      .to.emit(lottery, "WinnerPicked")
                      .withArgs(winner.address)

                  await expect(vrfCoordinatorV2Request)
                      .to.emit(lottery, "PrizeTransfered")
                      .withArgs(winner.address, prize)

                  // Check winner
                  assert.equal(await getWinner(), winner.address)

                  // Winner balance should update with prize
                  const winnerBalance = await getBalance(winner.address)

                  assert.equal(
                      winnerBalance.toString(),
                      winnerStartingBalance.add(prize).toString()
                  )

                  // Lottery should reset
                  assert.equal(await getNumberOfPlayers(), "0")

                  // LotteryState should be OPEN again
                  assert.equal(await getLotteryState(), "0")
              })
          })
      })
