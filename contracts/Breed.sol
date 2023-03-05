// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Breed is ERC721, ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter public tokenId;
    using SafeMath for uint256;

    // Define the interface for the NFT contract
    IERC721 public nftContract;

    // Event to signal a successful breed
    event BreedSuccessful(address owner, uint256 tokenId, uint256 dna);

    // Mapping to store the DNA of each NFT
    mapping(uint256 => uint256) public dna;

    // Constructor to set the NFT contract address and the name/symbol for the new NFTs
    constructor(string memory name, string memory symbol)
        ERC721(name, symbol)
    {}

    function mint(uint256 _newDna) public returns (uint256 newNftId_) {
        newNftId_ = tokenId.current();
        _mint(msg.sender, newNftId_);
        dna[newNftId_] = _newDna;
        tokenId.increment();
    }

    // Function to breed two NFTs and create a new DNA
    function breed(
        uint256 parent1Id,
        uint256 parent2Id,
        uint256 _newDna
    ) public {
        require(
            this.ownerOf(parent1Id) == msg.sender,
            "You do not own the first parent NFT"
        );
        require(
            this.ownerOf(parent2Id) == msg.sender,
            "You do not own the second parent NFT"
        );
        // Mint a new NFT with the new DNA and transfer it to the sender
        uint256 newTokenId = mint(_newDna);

        // Emit an event to signal a successful breed
        emit BreedSuccessful(msg.sender, newTokenId, _newDna);
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 _tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(_tokenId);
    }

    function setTokenURI(uint256 _tokenId, string memory _tokenURI) public {
        _setTokenURI(_tokenId, _tokenURI);
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(_tokenId);
    }
}
