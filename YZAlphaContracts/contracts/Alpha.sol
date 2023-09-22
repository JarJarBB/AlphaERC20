// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/**
 * @title Alpha
 * @dev Alpha is a smart contract that allows users to deposit tokenY and redeem tokenZ
 * based on a fixed conversion rate. It implements reentrancy protection
 * and is designed to be used with ERC20 tokens Y and Z.
 */
contract Alpha is Initializable, ReentrancyGuardUpgradeable {
    uint256 public constant Y_TO_Z = 100;

    IERC20Airdrop public tokenY;
    IERC20Airdrop public tokenZ;

    mapping(address => uint256) public redeemableZ;

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
        __ReentrancyGuard_init();
        tokenY = IERC20Airdrop(_tokenY);
        tokenZ = IERC20Airdrop(_tokenZ);
    }

    /**
     * @dev Allows users to deposit tokenY and receive redeemable tokenZ in exchange.
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
        redeemableZ[msg.sender] += amount * Y_TO_Z;
        emit YDeposit(amount, msg.sender);
    }

    /**
     * @dev Allows users to redeem their redeemable tokenZ.
     */
    function redeemZ() external nonReentrant {
        // Note: nonReetrant is not stricly necessary here
        // but it provides an extra layer of security
        uint256 amount = redeemableZ[msg.sender];
        require(amount > 0, "Amount must be greater than 0");
        redeemableZ[msg.sender] = 0;
        tokenZ.airdrop(msg.sender, amount);
        emit ZRedeem(amount, msg.sender);
    }
}

interface IERC20Airdrop is IERC20Upgradeable {
    function airdrop(address account, uint256 amount) external;
}
