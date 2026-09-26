// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title LiquodaProjectToken
 * @notice Digitale Projektanteile (Modell A, ERC-20) nach LIQUODA_SPEC.md, Abschnitt 8.
 *
 * - 1 Token = CHF 1, keine Dezimalstellen; Cap = Zielbetrag des Projekts
 * - Allowlist bei Mint und Transfer: Token gelangen nur an geprüfte Wallets
 * - Pausable, Rollen Owner (DEFAULT_ADMIN_ROLE), Minter, Pauser, Allowlist
 * - Dokument-Hashes (SHA-256) werden on-chain referenziert
 * - Keine Auszahlungs-, Rendite-, Governance- oder Upgrade-Logik
 * - Keine Personendaten: projectRef ist eine technische Projekt-ID
 */
contract LiquodaProjectToken is ERC20, ERC20Capped, ERC20Pausable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant ALLOWLIST_ROLE = keccak256("ALLOWLIST_ROLE");

    /// @notice Technische Referenz auf das Off-Chain-Projekt (UUID), keine Personendaten
    string public projectRef;

    mapping(address => bool) private _allowed;
    mapping(bytes32 => bool) private _documents;

    event AllowlistUpdated(address indexed account, bool allowed);
    event DocumentRegistered(bytes32 indexed sha256Hash, string label);
    event Minted(address indexed to, uint256 amount, string investmentRef);

    error NotAllowlisted(address account);
    error DocumentAlreadyRegistered(bytes32 sha256Hash);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 cap_,
        string memory projectRef_,
        address admin
    ) ERC20(name_, symbol_) ERC20Capped(cap_) {
        require(admin != address(0), "LIQUODA: admin required");
        projectRef = projectRef_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(ALLOWLIST_ROLE, admin);
    }

    /// @notice 1 Token = CHF 1
    function decimals() public pure override returns (uint8) {
        return 0;
    }

    function isAllowed(address account) public view returns (bool) {
        return _allowed[account];
    }

    function setAllowed(address account, bool allowed) external onlyRole(ALLOWLIST_ROLE) {
        _allowed[account] = allowed;
        emit AllowlistUpdated(account, allowed);
    }

    /// @notice Mint nach Backend-Freigabe (Zahlung bestätigt, KYC geprüft); nur an allowlistete Wallets
    function mint(address to, uint256 amount, string calldata investmentRef) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
        emit Minted(to, amount, investmentRef);
    }

    function isDocumentRegistered(bytes32 sha256Hash) public view returns (bool) {
        return _documents[sha256Hash];
    }

    /// @notice SHA-256-Hash eines Projektdokuments on-chain referenzieren
    function registerDocument(bytes32 sha256Hash, string calldata label) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_documents[sha256Hash]) revert DocumentAlreadyRegistered(sha256Hash);
        _documents[sha256Hash] = true;
        emit DocumentRegistered(sha256Hash, label);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /// @dev Allowlist-Prüfung für Mint (from = 0) und Transfer; Burn (to = 0) bleibt dem Sender vorbehalten
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Capped, ERC20Pausable)
    {
        if (to != address(0) && !_allowed[to]) revert NotAllowlisted(to);
        if (from != address(0) && !_allowed[from]) revert NotAllowlisted(from);
        super._update(from, to, value);
    }
}
