// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * EarlyApeNFT — Soul-bound BEP-721 badge for BANGRR.
 *
 * Minted to the first APE trader on a post once its price crosses 5× the
 * initial price. Token IDs are assigned off-chain by the BANGRR backend and
 * passed in via `mintTo(address, tokenId)`.
 *
 * Soul-bound: transfers are blocked. The badge stays with the original aper.
 *
 * Deploy via Remix on BSC Testnet (chainId 97):
 *   1. Open https://remix.ethereum.org
 *   2. Paste this file, compile with Solidity 0.8.20+
 *   3. Deploy with constructor args: ("BANGRR Early Ape", "APE", <your wallet>)
 *   4. Copy the deployed address into src/lib/early-ape-contract.ts
 *   5. (Optional) Call setMinter(<bangrr backend wallet>) to authorize a relayer
 */
contract EarlyApeNFT {
    string public name;
    string public symbol;
    address public owner;
    address public minter;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => string) private _tokenURIs;
    string public baseURI;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event MinterUpdated(address indexed minter);
    event BaseURIUpdated(string baseURI);

    error NotAuthorized();
    error AlreadyMinted();
    error SoulBound();
    error ZeroAddress();
    error NonexistentToken();

    constructor(string memory _name, string memory _symbol, address _owner) {
        name = _name;
        symbol = _symbol;
        owner = _owner;
        minter = _owner;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized();
        _;
    }

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
        emit MinterUpdated(_minter);
    }

    function setBaseURI(string calldata _uri) external onlyOwner {
        baseURI = _uri;
        emit BaseURIUpdated(_uri);
    }

    /**
     * Mint a badge. Anyone can call (permissionless self-claim) OR restrict to
     * `minter` by uncommenting the check below for a relayer-only flow.
     */
    function mintTo(address to, uint256 tokenId) external {
        // Uncomment to restrict minting to the BANGRR backend relayer:
        // if (msg.sender != minter && msg.sender != owner) revert NotAuthorized();
        if (to == address(0)) revert ZeroAddress();
        if (_owners[tokenId] != address(0)) revert AlreadyMinted();

        _owners[tokenId] = to;
        unchecked { _balances[to] += 1; }
        emit Transfer(address(0), to, tokenId);
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address o = _owners[tokenId];
        if (o == address(0)) revert NonexistentToken();
        return o;
    }

    function balanceOf(address holder) external view returns (uint256) {
        if (holder == address(0)) revert ZeroAddress();
        return _balances[holder];
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        if (_owners[tokenId] == address(0)) revert NonexistentToken();
        return string(abi.encodePacked(baseURI, _toString(tokenId)));
    }

    // ---- Soul-bound: block all transfers/approvals ----
    function transferFrom(address, address, uint256) external pure { revert SoulBound(); }
    function safeTransferFrom(address, address, uint256) external pure { revert SoulBound(); }
    function safeTransferFrom(address, address, uint256, bytes calldata) external pure { revert SoulBound(); }
    function approve(address, uint256) external pure { revert SoulBound(); }
    function setApprovalForAll(address, bool) external pure { revert SoulBound(); }
    function getApproved(uint256) external pure returns (address) { return address(0); }
    function isApprovedForAll(address, address) external pure returns (bool) { return false; }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == 0x80ac58cd || // ERC721
            interfaceId == 0x5b5e139f || // ERC721Metadata
            interfaceId == 0x01ffc9a7;   // ERC165
    }

    function _toString(uint256 v) private pure returns (string memory) {
        if (v == 0) return "0";
        uint256 t = v; uint256 d;
        while (t != 0) { d++; t /= 10; }
        bytes memory b = new bytes(d);
        while (v != 0) { d--; b[d] = bytes1(uint8(48 + v % 10)); v /= 10; }
        return string(b);
    }
}
