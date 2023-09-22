// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title ZeeToken
 * @dev ZeeToken is an ERC20-compatible token contract with access control roles
 * for minting tokens. It can be used by other contracts, such as the Alpha contract,
 * to mint ZeeTokens.
 */
contract ZeeToken is Initializable, ERC20Upgradeable, AccessControlUpgradeable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the ZeeToken contract, setting the name, symbol, and
     * granting the default admin role and MINTER_ROLE to the contract deployer.
     */
    function initialize() public initializer {
        __ERC20_init("ZeeToken", "Z");
        __AccessControl_init(); // we use roles because the Alpha contract needs to mint Z tokens

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    /**
     * @dev Allows a user with the MINTER_ROLE to airdrop ZeeTokens to a specified address.
     * @param to The address to which ZeeTokens will be airdropped.
     * @param amount The amount of ZeeTokens to airdrop.
     */
    function airdrop(
        address to,
        uint256 amount
    ) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}
