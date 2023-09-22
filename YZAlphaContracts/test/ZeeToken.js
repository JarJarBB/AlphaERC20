const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("ZeeToken", function () {
  // We define a fixture to reuse the same setup in every test.
  async function deployContractFixture() {
    // Contracts are deployed using the first signer/account by default
    const [defaultAdmin, minter, otherAccount] = await ethers.getSigners();

    const ZeeToken = await ethers.getContractFactory("ZeeToken");
    const zeeToken = await upgrades.deployProxy(ZeeToken);

    // Grant another account minter role
    const minterRole = await zeeToken.MINTER_ROLE();
    await zeeToken.grantRole(minterRole, minter);
    await zeeToken.renounceRole(minterRole, defaultAdmin); // renounce role to respect least privilege principle

    return { zeeToken, defaultAdmin, minter, otherAccount };
  }

  it("Should set the right default admin and minter roles", async function () {
    const { zeeToken, defaultAdmin, minter } = await loadFixture(
      deployContractFixture
    );

    const defaultAdminRole = await zeeToken.DEFAULT_ADMIN_ROLE();
    const minterRole = await zeeToken.MINTER_ROLE();

    const isDefaultAdmin = await zeeToken.hasRole(
      defaultAdminRole,
      defaultAdmin
    );
    const isMinter = await zeeToken.hasRole(minterRole, minter);

    expect(isDefaultAdmin).to.be.true;
    expect(isMinter).to.be.true;
  });

  it("Should have the correct name, symbol, and decimals", async function () {
    const { zeeToken } = await loadFixture(deployContractFixture);
    expect(await zeeToken.name()).to.equal("ZeeToken");
    expect(await zeeToken.symbol()).to.equal("Z");
    expect(await zeeToken.decimals()).to.equal(18); // default decimals on EVM
  });

  it("Should initialize the total supply with 0 tokens", async function () {
    const { zeeToken } = await loadFixture(deployContractFixture);
    const totalSupply = await zeeToken.totalSupply();
    expect(totalSupply).to.equal(0);
  });

  it("Should allow minter to airdrop tokens", async function () {
    const { zeeToken, minter, otherAccount } = await loadFixture(
      deployContractFixture
    );
    const amountToMint = ethers.parseEther("100"); // mint 100 tokens
    await zeeToken.connect(minter).airdrop(otherAccount.address, amountToMint);
    const balance = await zeeToken.balanceOf(otherAccount.address);
    expect(balance).to.equal(amountToMint);
  });

  it("Should not allow non-minter to mint tokens", async function () {
    const { zeeToken, otherAccount } = await loadFixture(deployContractFixture);
    const amountToMint = ethers.parseEther("10");
    const mintTrx = zeeToken
      .connect(otherAccount)
      .airdrop(otherAccount.address, amountToMint);

    await expect(mintTrx).to.be.revertedWith(
      /AccessControl: account .* is missing role .*/ // regex is needed because the err msg is dynamic
    );
  });

  it("Should transfer tokens between accounts", async function () {
    const { zeeToken, minter, otherAccount } = await loadFixture(
      deployContractFixture
    );
    const amountToTransfer = ethers.parseEther("50");
    await zeeToken.connect(minter).airdrop(minter.address, amountToTransfer);

    await zeeToken
      .connect(minter)
      .transfer(otherAccount.address, amountToTransfer);

    const minterBalance = await zeeToken.balanceOf(minter.address);
    const otherAccountBalance = await zeeToken.balanceOf(otherAccount.address);

    expect(minterBalance).to.equal(0);
    expect(otherAccountBalance).to.equal(amountToTransfer);
  });
});
