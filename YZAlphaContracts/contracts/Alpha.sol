// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/**
 * @title Alpha
 * @dev Alpha is a smart contract that allows users to deposit tokenY and redeem tokenZ
 * based on a fixed conversion rate. It implements reentrancy protection
 * and is designed to be used with ERC20 tokens Y and Z.
 */
contract Alpha is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    uint256 public constant Z_AMOUNT = 100 * (10 ** 18);

    IERC20Airdrop public tokenY;
    IERC20Airdrop public tokenZ;

    mapping(address => uint256) public contributions;
    address[] public contributionKeys;
    uint256 public totalContribution;

    event YDeposit(uint256 value, address from);
    event ZRedeem(uint256 value, address to);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the Alpha contract, setting the addresses of tokenY and tokenZ.
     * @param _tokenY The address of tokenY that users can deposit.
     * @param _tokenZ The address of tokenZ that users can redeem.
     */
    function initialize(address _tokenY, address _tokenZ) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        tokenY = IERC20Airdrop(_tokenY);
        tokenZ = IERC20Airdrop(_tokenZ);
    }

    /**
     * @dev Get the entire contributionKeys array.
     * @return An array of addresses.
     */
    function getContributionKeys() external view returns (address[] memory) {
        return contributionKeys;
    }

    /**
     * @dev Allows users to deposit tokenY to receive future tokenZ.
     * Emits a `YDeposit` event with the amount of Y tokens contributed.
     * @param amount The amount of tokenY to deposit.
     */
    function depositY(uint256 amount) external nonReentrant {
        // Note: in this case nonReetrant is not stricly necessary
        // but it provides an extra layer of security
        require(amount > 0, "Amount must be greater than 0");
        require(
            tokenY.transferFrom(msg.sender, address(this), amount),
            "Failed to transfer tokens to this contract"
        );
        if (contributions[msg.sender] == 0) {
            contributionKeys.push(msg.sender);
        }
        contributions[msg.sender] += amount;
        totalContribution += amount;
        emit YDeposit(amount, msg.sender);
    }

    /**
     * @dev Distributes the Z token share to a contributor.
     */
    function processOne(address contributor) private {
        uint256 yAmount = contributions[contributor];
        if (yAmount == 0) {
            return;
        }
        contributions[contributor] = 0;

        // Note: safe math is included in sol 0.8+
        uint256 zShare = (yAmount * Z_AMOUNT) / totalContribution;

        tokenZ.airdrop(contributor, zShare);
        emit ZRedeem(zShare, contributor);
    }

    /**
     * @dev Distributes the Z token share to all contributors proportionally based on their Y token deposits.
     * This function is called by the contract owner to distribute Z tokens to all contributors.
     * The Z token share for each contributor is calculated based on their Y token deposits relative to the total Y token deposits.
     * Emits a `ZRedeem` event for each contributor with the amount of Z tokens they received.
     * Resets all contribution amounts to 0 after distribution.
     */
    function distributeAllZ() external onlyOwner nonReentrant {
        require(totalContribution > 0, "Amount must be greater than 0");
        for (uint256 i = 0; i < contributionKeys.length; i++) {
            processOne(contributionKeys[i]);
        }
        totalContribution = 0;
    }
}

interface IERC20Airdrop is IERC20Upgradeable {
    function airdrop(address account, uint256 amount) external;
}
