import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Alpha, WhyToken, ZeeToken } from "../typechain-types";

describe("Alpha", function () {
  const Z_AMOUNT = ethers.parseEther("100"); // we need a Z amount of 100 * 10 ** 18

  // We define a fixture to reuse the same setup in every test.
  async function deployContractFixture() {
    // Contracts are deployed using the first signer/account by default
    const [admin, otherAccount] = await ethers.getSigners();

    // Deploy WhyToken
    const WhyToken = await ethers.getContractFactory("WhyToken");
    const whyToken = (await upgrades.deployProxy(WhyToken)) as any as WhyToken;
    const whyAddress = await whyToken.getAddress();

    // Deploy ZeeToken
    const ZeeToken = await ethers.getContractFactory("ZeeToken");
    const zeeToken = (await upgrades.deployProxy(ZeeToken)) as any as ZeeToken;
    const zeeAddress = await zeeToken.getAddress();

    // Deploy the Alpha contract
    const Alpha = await ethers.getContractFactory("Alpha");
    const alpha = (await upgrades.deployProxy(Alpha, [
      whyAddress,
      zeeAddress,
    ])) as any as Alpha;
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

  it("Should deposit Y tokens and increase contributions", async function () {
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
    expect(await alpha.contributions(otherAccount.address)).to.equal(yAmount);
  });

  it("Should not be able to deposit zero Y tokens", async function () {
    const { otherAccount, alpha } = await loadFixture(deployContractFixture);
    await expect(alpha.connect(otherAccount).depositY(0)).to.be.revertedWith(
      "Amount must be greater than 0"
    );
  });

  it("Should redeem Z tokens and reset contributions", async function () {
    const { whyToken, zeeToken, admin, otherAccount, alpha } =
      await loadFixture(deployContractFixture);

    // Deposit Y tokens for User 1
    const yAmount1 = 300;
    await whyToken
      .connect(otherAccount)
      .airdrop(otherAccount.address, yAmount1);
    const alphaAddress = await alpha.getAddress();
    await whyToken.connect(otherAccount).approve(alphaAddress, yAmount1);
    await alpha.connect(otherAccount).depositY(yAmount1);

    // Deposit Y tokens for User 2
    const yAmount2 = 100;
    await whyToken.airdrop(admin.address, yAmount2);
    await whyToken.approve(alphaAddress, yAmount2);
    await alpha.depositY(yAmount2);

    expect(await alpha.totalContribution()).to.equal(yAmount1 + yAmount2);

    // Distribute Z tokens
    await alpha.distributeAllZ();
    expect(await zeeToken.balanceOf(otherAccount.address)).to.equal(
      (Z_AMOUNT * BigInt(yAmount1)) / BigInt(yAmount1 + yAmount2)
    );
    expect(await zeeToken.balanceOf(admin.address)).to.equal(
      (Z_AMOUNT * BigInt(yAmount2)) / BigInt(yAmount1 + yAmount2)
    );
    expect(await alpha.totalContribution()).to.equal(0);
  });

  it("Should not allow non-admin to distribute Z tokens", async function () {
    const { otherAccount, alpha } = await loadFixture(deployContractFixture);
    await expect(
      alpha.connect(otherAccount).distributeAllZ()
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should emit correct events", async function () {
    const { whyToken, admin, alpha } = await loadFixture(deployContractFixture);

    // Check for deposit event
    const yAmount = 200;
    await whyToken.airdrop(admin.address, yAmount);
    const alphaAddress = await alpha.getAddress();
    await whyToken.approve(alphaAddress, yAmount);
    await expect(alpha.depositY(yAmount))
      .to.emit(alpha, "YDeposit")
      .withArgs(yAmount, admin.address);

    // Check for redeem event
    await expect(alpha.distributeAllZ())
      .to.emit(alpha, "ZRedeem")
      .withArgs(Z_AMOUNT, admin.address);
  });
});
