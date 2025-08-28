import { ethers } from 'ethers';

// Test the exact signature verification process the contract uses
async function testSignatureVerification() {
    try {
        // Contract details
        const contractAddress = "0x394d064C4E22F6D6D2C0bC0673BA6dFb88BdF679";
        const rpcUrl = "https://ethereum-sepolia-rpc.publicnode.com";
        
        // Create provider and signer
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const signer = new ethers.Wallet("e5489ca9cf2f168b1047545edf62344f2bf3b75ad9a94192492231f5920d5160"); // Replace with your actual private key
        
        // Contract ABI
        const abi = [
            "function getListingMessageHash(uint256 _type, string _dataIdentifier, address _user, uint256 _feeInToken, uint256 _deadline) external view returns (bytes32)"
        ];
        
        // Create contract instance
        const contract = new ethers.Contract(contractAddress, abi, provider);
        
        console.log("=== SIGNATURE VERIFICATION TEST ===");
        
        // Test data (same as your frontend)
        const testData = {
            listingType: 0,
            dataIdentifier: 'mock://mock_metadata_1755048974369_glaepa62n',
            userAddress: '0x9149cBaE3C32Ceca4Cc2cEfbE638c133902B9e8f',
            feeInToken: ethers.parseEther("10"),
            deadline: 1755052634
        };
        
        console.log("Test data:", testData);
        console.log("Signer address:", await signer.getAddress());
        
        // 1. Generate the message hash (same as contract)
        const messageHash = await contract.getListingMessageHash(
            testData.listingType,
            testData.dataIdentifier,
            testData.userAddress,
            testData.feeInToken,
            testData.deadline
        );
        console.log("1. Message hash:", messageHash);
        
        // 2. Create EIP-712 domain
        const domain = {
            name: 'ListingManager',
            version: '1',
            chainId: 11155111,
            verifyingContract: contractAddress,
        };
        
        // 3. EIP-712 types
        const types = {
            Listing: [
                { name: 'listingType', type: 'uint256' },
                { name: 'dataIdentifier', type: 'string' },
                { name: 'userAddress', type: 'address' },
                { name: 'feeInToken', type: 'uint256' },
                { name: 'deadline', type: 'uint256' },
            ],
        };
        
        // 4. Sign the data
        const signature = await signer.signTypedData(domain, types, testData);
        console.log("2. Generated signature:", signature);
        
        // 5. Verify the signature locally
        const recoveredAddress = ethers.verifyTypedData(domain, types, testData, signature);
        console.log("3. Locally recovered address:", recoveredAddress);
        console.log("4. Expected address:", await signer.getAddress());
        console.log("5. Local verification:", recoveredAddress === await signer.getAddress());
        
        // 6. Test ECDSA.recover directly (what the contract does)
        const ecdsaRecovered = ethers.recoverAddress(messageHash, signature);
        console.log("6. ECDSA.recover result:", ecdsaRecovered);
        console.log("7. ECDSA verification:", ecdsaRecovered === await signer.getAddress());
        
        // 7. Test with different signature formats
        console.log("\n=== SIGNATURE FORMAT TESTING ===");
        
        // Split signature into components
        const sig = ethers.Signature.from(signature);
        console.log("Signature components:");
        console.log("  r:", sig.r);
        console.log("  s:", sig.s);
        console.log("  v:", sig.v);
        console.log("  yParity:", sig.yParity);
        
        // Test recovery with different v values
        const v27 = ethers.recoverAddress(messageHash, { r: sig.r, s: sig.s, v: 27 });
        const v28 = ethers.recoverAddress(messageHash, { r: sig.r, s: sig.s, v: 28 });
        
        console.log("Recovery with v=27:", v27);
        console.log("Recovery with v=28:", v28);
        console.log("v=27 matches signer:", v27 === await signer.getAddress());
        console.log("v=28 matches signer:", v28 === await signer.getAddress());
        
        // 8. Test the exact signature format the contract expects
        const contractSignature = ethers.Signature.from(signature);
        const contractRecovered = ethers.recoverAddress(messageHash, contractSignature);
        console.log("\n8. Contract-style recovery:", contractRecovered);
        console.log("9. Contract verification:", contractRecovered === await signer.getAddress());
        
        console.log("\n=== END TEST ===");
        
    } catch (error) {
        console.error("Error in testing:", error);
    }
}

// Run the test
testSignatureVerification().catch(console.error);
