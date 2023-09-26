import { ethers } from "ethers";
import ZeeToken from "../YZAlphaContracts/artifacts/contracts/ZeeToken.sol/ZeeToken.json";
import Alpha from "../YZAlphaContracts/artifacts/contracts/Alpha.sol/Alpha.json";
import contracts from "../YZAlphaContracts/contract-addresses.json";

/**
 * Number of users to interact with.
 * @constant {number}
 */
const N_USERS = 3;

/**
 * Ethereum JSON-RPC Provider instance.
 * @constant {ethers.JsonRpcProvider}
 */
const provider = new ethers.JsonRpcProvider();

/**
 * Ethereum Contract instance for the ZeeToken.
 * @constant {ethers.Contract}
 */
const zeeContract = new ethers.Contract(
  contracts.zeeAddress,
  ZeeToken.abi,
  provider
);

/**
 * Ethereum Contract instance for the Alpha contract.
 * @constant {ethers.Contract}
 */
const alphaContract = new ethers.Contract(
  contracts.alphaAddress,
  Alpha.abi,
  provider
);

/**
 * Retrieves the Ethereum addresses of the three users.
 * @async
 * @function
 * @returns {Promise<string[]>} Array of Ethereum addresses.
 */
const getUserAddresses = async (): Promise<string[]> => {
  const accountReqs = [];
  for (let i = 0; i < N_USERS; i++) {
    accountReqs.push(provider.getSigner(i));
  }
  const accounts = await Promise.all(accountReqs); // parallel loading is faster
  return accounts.map((a) => a.address); // keep only the addresses
};

/**
 * Retrieves the ZeeToken balances of the three users.
 * @async
 * @function
 * @returns {Promise<number[]>} Array of ZeeToken balances in ETH.
 */
export const getZBalances = async (): Promise<number[]> => {
  const userAddresses = await getUserAddresses();
  const balanceReqs = userAddresses.map((address) =>
    zeeContract.balanceOf(address)
  );
  const rawBalance = await Promise.all(balanceReqs); // parallel balance loading!
  return rawBalance.map((rb) => parseFloat(ethers.formatEther(rb)));
};

/**
 * Retrieves the Alpha Contract contributions of the three users.
 * @async
 * @function
 * @returns {Promise<number[]>} Array of contributions in ETH.
 */
export const getContributions = async (): Promise<number[]> => {
  const userAddresses = await getUserAddresses();
  const contributionReqs = userAddresses.map((address) =>
    alphaContract.contributions(address)
  );
  const rawAmounts = await Promise.all(contributionReqs);
  return rawAmounts.map((rb) => parseFloat(ethers.formatEther(rb)));
};
