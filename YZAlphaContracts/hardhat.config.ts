import { task, HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import * as contracts from "./contract-addresses.json";
import { HardhatRuntimeEnvironment } from "hardhat/types/runtime";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const user2account = async (
  user: string,
  hre: HardhatRuntimeEnvironment
): Promise<HardhatEthersSigner> => {
  let userNum: number;
  switch (user) {
    case "owner":
      userNum = 0;
      break;
    case "alice":
      userNum = 1;
      break;
    case "bob":
      userNum = 2;
      break;
    default:
      throw new Error("incorrect user name");
  }
  const allAccounts = await hre.ethers.getSigners();
  return allAccounts[userNum];
};

task("y-balance", "Prints an account's Y balance")
  .addParam("user", "The name of the account user")
  .setAction(async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
    const Contract = await hre.ethers.getContractFactory("WhyToken");
    const whyToken = (await Contract.attach(contracts.whyAddress)) as any;
    const account = await user2account(taskArgs.user, hre);
    const balance = await whyToken.balanceOf(account.address);
    console.log(hre.ethers.formatEther(balance), "Y tokens");
  });

task("airdrop-y", "Faucet to get free Y tokens")
  .addParam("user", "The name of the account user")
  .addParam("amount", "The value of the airdrop")
  .setAction(async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
    const Contract = await hre.ethers.getContractFactory("WhyToken");
    const whyToken = (await Contract.attach(contracts.whyAddress)) as any;
    const account = await user2account(taskArgs.user, hre);
    const amount = hre.ethers.parseEther(taskArgs.amount);
    await whyToken.connect(account).airdrop(account.address, amount);
    console.log("minted", taskArgs.amount, "Y token to", account.address);
  });

task("z-balance", "Prints an account's Z balance")
  .addParam("user", "The name of the account user")
  .setAction(async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
    const Contract = await hre.ethers.getContractFactory("ZeeToken");
    const zeeToken = (await Contract.attach(contracts.zeeAddress)) as any;
    const account = await user2account(taskArgs.user, hre);
    const balance = await zeeToken.balanceOf(account.address);
    console.log(hre.ethers.formatEther(balance), "Z tokens");
  });

task(
  "alpha-contributions",
  "Prints the contribution state of the Alpha contract"
).setAction(async (_taskArgs: any, hre: HardhatRuntimeEnvironment) => {
  // Connect the Alpha contract
  const Contract = await hre.ethers.getContractFactory("Alpha");
  const alpha = (await Contract.attach(contracts.alphaAddress)) as any;

  // Get a list of contributors and remove duplicates
  const keys = await alpha.getContributionKeys();
  const cleanKeys = [...new Set<string>(keys)];
  const totalContribution = await alpha.totalContribution();

  // Print each contribution as a percentage of the total
  for (const key of cleanKeys) {
    const value = await alpha.contributions(key);
    if (!value) {
      continue;
    }
    const percentage = (100 * Number(value)) / Number(totalContribution);
    console.log(`${percentage.toFixed(1)}% from ${key}`);
  }
  console.log(
    "\ntotal contribution:",
    hre.ethers.formatEther(totalContribution),
    "Y tokens in Alpha"
  );
});

task("deposit-y", "Deposit Y tokens to receive future Z tokens")
  .addParam("user", "The name of the account user")
  .addParam("amount", "The contribution value")
  .setAction(async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
    // Connect the Alpha contract
    const Contract = await hre.ethers.getContractFactory("Alpha");
    const alpha = (await Contract.attach(contracts.alphaAddress)) as any;

    // Connect the Y Token contract
    const WhyToken = await hre.ethers.getContractFactory("WhyToken");
    const whyToken = (await WhyToken.attach(contracts.whyAddress)) as any;

    // Authorize Alpha to transfer Y tokens
    const account = await user2account(taskArgs.user, hre);
    const amount = hre.ethers.parseEther(taskArgs.amount);
    await whyToken.connect(account).approve(contracts.alphaAddress, amount);

    // Deposit Y tokens
    await alpha.connect(account).depositY(amount);
    console.log("contributed", taskArgs.amount, "Y tokens");
  });

task("distribute-z", "Mint and distribute all Z tokens")
  .addParam("user", "The name of the account user")
  .setAction(async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
    const Contract = await hre.ethers.getContractFactory("Alpha");
    const alpha = (await Contract.attach(contracts.alphaAddress)) as any;
    const account = await user2account(taskArgs.user, hre);
    await alpha.connect(account).distributeAllZ();
    const zAmount = await alpha.Z_AMOUNT();
    console.log(
      "minted and distributed",
      hre.ethers.formatEther(zAmount),
      "Z tokens"
    );
  });

const config: HardhatUserConfig = {
  solidity: "0.8.19",
};

export default config;
