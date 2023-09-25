import { ethers, upgrades } from "hardhat";
import fs from "fs";

async function main() {
  // Contracts are deployed using the first signer/account by default
  const [owner] = await ethers.getSigners();

  // Deploy WhyToken
  const WhyToken = await ethers.getContractFactory("WhyToken");
  const whyToken = await upgrades.deployProxy(WhyToken);
  await whyToken.waitForDeployment();
  const whyAddress = await whyToken.getAddress();
  console.log("\n\tY Token Address ->", whyAddress);

  // Deploy ZeeToken
  const ZeeToken = await ethers.getContractFactory("ZeeToken");
  const zeeToken = await upgrades.deployProxy(ZeeToken);
  await zeeToken.waitForDeployment();
  const zeeAddress = await zeeToken.getAddress();
  console.log("\n\tZ Token address ->", zeeAddress);

  // Deploy the Alpha contract
  const Alpha = await ethers.getContractFactory("Alpha");
  const alpha = await upgrades.deployProxy(Alpha, [whyAddress, zeeAddress]);
  await alpha.waitForDeployment();
  const alphaAddress = await alpha.getAddress();
  console.log("\n\tAlpha address --->", alphaAddress);

  // Move the minting role to the Alpha contract
  const minterRole = await zeeToken.MINTER_ROLE();
  await zeeToken.grantRole(minterRole, alphaAddress);
  await zeeToken.renounceRole(minterRole, owner);
  console.log("\n\tAlpha contract now has sole minting rights");

  // Save contract addresses to file
  const addresses = JSON.stringify({ whyAddress, zeeAddress, alphaAddress });
  fs.writeFileSync("contract-addresses.json", addresses);
  console.log("\n\tSuccessfully saved contract addresses to file", "\n");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
