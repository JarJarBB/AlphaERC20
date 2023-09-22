const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("WhyToken", function () {
  // We define a fixture to reuse the same setup in every test.
  async function deployContractFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const WhyToken = await ethers.getContractFactory("WhyToken");
    const whyToken = await upgrades.deployProxy(WhyToken);

    return { whyToken, owner, otherAccount };
  }

  it("Should have the correct name, symbol, and decimals", async function () {
    const { whyToken } = await loadFixture(deployContractFixture);
    expect(await whyToken.name()).to.equal("WhyToken");
    expect(await whyToken.symbol()).to.equal("Y");
    expect(await whyToken.decimals()).to.equal(18); // 18 decimals is the default in the EVM world
  });

  it("Should initialize the total supply with 0 tokens", async function () {
    const { whyToken } = await loadFixture(deployContractFixture);
    const totalSupply = await whyToken.totalSupply();
    expect(totalSupply).to.equal(0);
  });

  it("Should allow non-owner to airdrop tokens", async function () {
    const { whyToken, otherAccount } = await loadFixture(deployContractFixture);
    const amountToMint = ethers.parseEther("100"); // request 100 tokens
    await whyToken
      .connect(otherAccount)
      .airdrop(otherAccount.address, amountToMint);
    const balance = await whyToken.balanceOf(otherAccount.address);
    expect(balance).to.equal(amountToMint);
  });

  it("Should transfer tokens between accounts", async function () {
    const { whyToken, owner, otherAccount } = await loadFixture(
      deployContractFixture
    );
    const amountToTransfer = ethers.parseEther("50");
    await whyToken.connect(owner).airdrop(owner.address, amountToTransfer);

    await whyToken
      .connect(owner)
      .transfer(otherAccount.address, amountToTransfer);

    const ownerBalance = await whyToken.balanceOf(owner.address);
    const otherAccountBalance = await whyToken.balanceOf(otherAccount.address);

    expect(ownerBalance).to.equal(0);
    expect(otherAccountBalance).to.equal(amountToTransfer);
  });
});
