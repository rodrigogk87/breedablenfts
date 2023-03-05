const Web3 = require('web3');
const contractArtifact = require('./artifacts/contracts/Breed.sol/Breed.json');
const { create } = require('ipfs-http-client')
const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config()

// Set up the Web3 provider
const web3 = new Web3('http://127.0.0.1:8545');

// Set up the BreedContract instance
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Replace with your deployed contract address
const contract = new web3.eth.Contract(contractArtifact.abi, contractAddress);

// Set up the default account
const defaultAccount = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // Replace with your default account
web3.eth.defaultAccount = defaultAccount;
const dna = crypto.randomBytes(24).toString('hex');

// Function to mint a new NFT and assign traits to its DNA
async function mintNFT() {
    try {
        // Generate an RGB image based on the DNA
        const { newDna, imageHash } = await assignTraits(dna);
        // Mint a new NFT
        const mintTx = await contract.methods.mint(newDna).send({ from: defaultAccount });

        // Get the ID of the newly minted NFT
        const tokenId = mintTx.events.Transfer.returnValues.tokenId;


        // Send the IPFS hash to the smart contract
        await contract.methods.setTokenURI(tokenId, `ipfs://${imageHash}`).send({ from: defaultAccount });

        console.log(`New NFT minted with ID ${tokenId} and IPFS hash ${imageHash}`);
    } catch (error) {
        console.error(error);
    }
}

async function assignTraits(dna) {
    // Extract the individual RGB values from the DNA string
    const [r1, g1, b1, r2, g2, b2, r3, g3, b3, r4, g4, b4] = dna.match(/.{2}/g).map(h => parseInt(h, 16));

    // Calculate the parent DNA values using the first 6 hexadecimal characters of the DNA string
    const parent1Dna = parseInt(dna.substr(0, 6), 16);
    const parent2Dna = parseInt(dna.substr(6, 6), 16);

    // Calculate the new DNA value using the createNewDna function
    const split = (Math.floor(Math.random() * 8) + 1);
    const newDna = ((parent1Dna / split) * split) + (parent2Dna % split);

    // Encode the RGB values into a Buffer object
    const buffer = Buffer.from([r1, g1, b1, r2, g2, b2, r3, g3, b3, r4, g4, b4]);

    // Create an RGB image using the buffer data
    const sharp = require('sharp');
    sharp({
        create: {
            width: 100,
            height: 100,
            channels: 3,
            background: buffer
        }
    })
        .png()
        .toFile('image.png', function (err, info) {
            if (err) {
                console.error(err);
            } else {
                console.log(info);
            }
        });


    const file = fs.readFileSync('image.png');
    const projectId = process.env.INFURA_PROJECT_ID;
    const projectSecret = process.env.INFURA_API_SECRET;
    const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');
    const ipfs = create({
        host: 'ipfs.infura.io', port: 5001, protocol: 'https',
        headers: {
            authorization: auth,
        },
    })
    try {
        const fileAdded = await ipfs.add(file);

        const imageHash = fileAdded.cid.toString();

        return { newDna, imageHash };
    }
    catch (e) {
        console.log(e);
        exit();
    }
}

async function mixDNA(parentTokenId1, parentTokenId2) {
    let dna1 = await contract.methods.dna(parentTokenId1).call();
    let dna2 = await contract.methods.dna(parentTokenId2).call();
    const dnaLength = 24;
    const halfLength = Math.floor(dnaLength / 2);
    let _newDna = dna1.substr(0, halfLength) + dna2.substr(halfLength, dnaLength - halfLength);

    // introduce random mutations to the new DNA string
    for (let i = 0; i < dnaLength / 10; i++) {
        const randomIndex = Math.floor(Math.random() * dnaLength);
        const randomChar = Math.floor(Math.random() * 16).toString(16);
        _newDna = _newDna.substr(0, randomIndex) + randomChar + _newDna.substr(randomIndex + 1);
    }

    // pad the new DNA string with zeros if it is too short
    while (_newDna.length < dnaLength) {
        _newDna += '0';
    }
    const { newDna, imageHash } = await assignTraits(_newDna);

    const mintTx = await contract.methods.breed(0, 1, newDna).send({ from: defaultAccount });

    // Get the ID of the newly minted NFT
    const tokenId = mintTx.events.Transfer.returnValues.tokenId;

    // Send the IPFS hash to the smart contract
    await contract.methods.setTokenURI(tokenId, `ipfs://${imageHash}`).send({ from: defaultAccount });

    console.log(`New NFT breeded with ID ${tokenId} and IPFS hash ${imageHash} and dna ${newDna}`);

}

async function getData(tokenId) {
    try {
        // Mint a new NFT
        const tokenuri = await contract.methods.tokenURI(tokenId).call();

        console.log(`tokenuri ${tokenuri}`);
    } catch (error) {
        console.error(error);
    }
}

// mint a parent nft
//mintNFT();
//get token data
//getData(tokenId);
//breed 2 nfts
mixDNA(0, 1);