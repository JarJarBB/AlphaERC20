// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

interface IERC20Alpha is IERC20Upgradeable {
    function airdrop(address account, uint256 amount) external;
}
