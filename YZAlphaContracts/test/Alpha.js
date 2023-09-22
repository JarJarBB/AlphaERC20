const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("Alpha", function () {
  const Y_TO_Z = 100; // "exchange rate" between tokens Y and Z

  // We define a fixture to reuse the same setup in every test.
  async function deployContractFixture() {
    // Contracts are deployed using the first signer/account by default
    const [admin, otherAccount] = await ethers.getSigners();

    // Deploy WhyToken
    const WhyToken = await ethers.getContractFactory("WhyToken");
    const whyToken = await upgrades.deployProxy(WhyToken);
    const whyAddress = await whyToken.getAddress();

    // Deploy ZeeToken
    const ZeeToken = await ethers.getContractFactory("ZeeToken");
    const zeeToken = await upgrades.deployProxy(ZeeToken);
    const zeeAddress = await zeeToken.getAddress();

    // Deploy the Alpha contract
    const Alpha = await ethers.getContractFactory("Alpha");
    const alpha = await upgrades.deployProxy(Alpha, [whyAddress, zeeAddress]);
    const alphaAddress = await alpha.getAddress();

    // Move the minting role to the Alpha contract
    const minterRole = await zeeToken.MINTER_ROLE();
    await zeeToken.grantRole(minterRole, alphaAddress);
    await zeeToken.renounceRole(minterRole, admin);

    return { whyToken, zeeToken, alpha, admin, otherAccount };
  }

  it("Should set the right token addresses", async function () {
    const { whyToken, zeeToken, alpha } = await loadFixture(
      deployContractFixture
    );
    expect(await alpha.tokenY()).to.equal(await whyToken.getAddress());
    expect(await alpha.tokenZ()).to.equal(await zeeToken.getAddress());
  });

  it("Should deposit Y tokens and increase redeemableZ", async function () {
    const { whyToken, otherAccount, alpha } = await loadFixture(
      deployContractFixture
    );

    // Airdrop some Y tokens
    const yAmount = 20;
    await whyToken.connect(otherAccount).airdrop(otherAccount.address, yAmount);

    // Authorize Alpha contract to tranfer Y funds
    const alphaAddress = await alpha.getAddress();
    await whyToken.connect(otherAccount).approve(alphaAddress, yAmount);

    // Deposit Y tokens
    await alpha.connect(otherAccount).depositY(yAmount);
    expect(await whyToken.balanceOf(otherAccount.address)).to.equal(0);
    expect(await alpha.redeemableZ(otherAccount.address)).to.equal(
      yAmount * Y_TO_Z
    );
  });

  it("Should not be able to deposit zero Y tokens", async function () {
    const { otherAccount, alpha } = await loadFixture(deployContractFixture);
    await expect(alpha.connect(otherAccount).depositY(0)).to.be.revertedWith(
      "Amount must be greater than 0"
    );
  });

  it("Should redeem Z tokens and reset redeemableZ", async function () {
    const { whyToken, zeeToken, otherAccount, alpha } = await loadFixture(
      deployContractFixture
    );

    // Deposit Y tokens
    const yAmount = 40;
    await whyToken.connect(otherAccount).airdrop(otherAccount.address, yAmount);
    const alphaAddress = await alpha.getAddress();
    await whyToken.connect(otherAccount).approve(alphaAddress, yAmount);
    await alpha.connect(otherAccount).depositY(yAmount);

    // Redeem Z tokens
    await alpha.connect(otherAccount).redeemZ();
    expect(await zeeToken.balanceOf(otherAccount.address)).to.equal(
      yAmount * Y_TO_Z
    );
    expect(await alpha.redeemableZ(otherAccount.address)).to.equal(0);
  });

  it("Should not redeem Z tokens without first depositing Y tokens", async function () {
    const { otherAccount, alpha } = await loadFixture(deployContractFixture);
    await expect(alpha.connect(otherAccount).redeemZ()).to.be.revertedWith(
      "Amount must be greater than 0"
    );
  });

  it("Should emit correct events", async function () {
    const { whyToken, admin, alpha } = await loadFixture(deployContractFixture);

    // Check for deposit event
    const yAmount = 40;
    await whyToken.airdrop(admin.address, yAmount);
    const alphaAddress = await alpha.getAddress();
    await whyToken.approve(alphaAddress, yAmount);
    await expect(alpha.depositY(yAmount))
      .to.emit(alpha, "YDeposit")
      .withArgs(yAmount, admin.address);

    // Check for redeem event
    await expect(alpha.redeemZ())
      .to.emit(alpha, "ZRedeem")
      .withArgs(yAmount * Y_TO_Z, admin.address);
  });
});
