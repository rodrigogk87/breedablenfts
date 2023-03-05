import { ethers } from "hardhat";

async function main() {

  const Breed = await ethers.getContractFactory("Breed");
  const breed = await Breed.deploy('BreedNFT', 'BNFT');

  await breed.deployed();

  console.log(
    `breed contract deployed to ${breed.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
