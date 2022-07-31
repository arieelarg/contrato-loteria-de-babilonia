const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery Unit Test", () => {
          let lottery, vrfCoordinatorV2Mock, ticketPrice, deployer

          const { chainId } = network.config
          const config = networkConfig[chainId]

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              lottery = await ethers.getContract("Lottery")
              ticketPrice = await lottery.getTicketPrice()
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
          })

          const buyTicket = async (value = ticketPrice) => await lottery.buyTicket({ value })

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
                  await expect(buyTicket(0)).to.be.revertedWith(
                      "Lottery__SendMoreETHToEnterLottery"
                  )
              })

              it("record players when they enter", async () => {
                  await buyTicket()
                  const contractPlayer = await lottery.getPlayer(0)
                  assert.equal(contractPlayer, deployer)
              })

              it("emits event when enter lottery", async () => {
                  await expect(buyTicket()).to.emit(lottery, "EnterLottery")
              })
          })

          describe("fulfillRandomWords", () => {
              beforeEach(async () => {
                  await buyTicket()
              })

              it("doesn't allow entrance when lottery is calculating", async () => {
                  await lottery.getRandomWinner()
                  expect(buyTicket()).to.be.revertedWith("Lottery__NotOpen")
              })

              it("picks a winner, resets, and sends money", async () => {
                  // LotteryState should be OPEN
                  assert.equal(await lottery.getLotteryState(), "0")

                  // Requesting random winner
                  await lottery.getRandomWinner()

                  // LotteryState should be CALCULATING
                  assert.equal(await lottery.getLotteryState(), "1")

                  // While CALCULATING random winner should emit RequestedWinner event
                  await expect(lottery.getRandomWinner()).to.emit(lottery, "RequestedWinner")

                  assert.equal(Number(await lottery.getPrize()), 75000000000000)

                  const tx = await lottery.getRandomWinner()
                  const txReceipt = await tx.wait(1)
                  const request = await vrfCoordinatorV2Mock.fulfillRandomWords(
                      txReceipt.events[1].args.requestId,
                      lottery.address
                  )

                  // Wait for WinnerPicked event to emit
                  await expect(request).to.emit(lottery, "WinnerPicked").withArgs(deployer)

                  // Get last winner
                  const lastWinner = await lottery.getLastWinner()

                  // Winner should be equal to deployer (since its the only playing)
                  assert.equal(lastWinner.toString(), deployer)

                  // Lottery should reset
                  assert.equal(Number(await lottery.getNumberOfPlayers()), 0)

                  // LotteryState should be OPEN again
                  assert.equal(Number(await lottery.getLotteryState()), 0)
              })
          })
      })
