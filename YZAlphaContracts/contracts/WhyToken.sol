// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title WhyToken
 * @dev WhyToken is an ERC20-compatible test token contract for experimental purposes.
 * It allows anyone to mint unlimited Y tokens for testing purposes.
 */
contract WhyToken is Initializable, ERC20Upgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the WhyToken contract, setting the name and symbol.
     * This test token contract does not require "roles" or an admin.
     */
    function initialize() public initializer {
        __ERC20_init("WhyToken", "Y");
    }

    /**
     * @dev Allows anyone to airdrop Y tokens to a specified address for testing purposes.
     * @param to The address to which Y tokens will be airdropped.
     * @param amount The amount of Y tokens to airdrop.
     */
    function airdrop(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
