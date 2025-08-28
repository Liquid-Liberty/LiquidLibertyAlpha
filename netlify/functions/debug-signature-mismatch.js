import { ethers } from 'ethers';

// Comprehensive debugging script to identify signature mismatch
async function debugSignatureMismatch() {
    try {
        // Contract details
        const contractAddress = "0x394d064C4E22F6D6D2C0bC0673BA6dFb88BdF679";
        const rpcUrl = "https://ethereum-sepolia-rpc.publicnode.com"; // Public RPC
        
        // Contract ABI - we need more functions for debugging
        const abi = [
            "function trustedSigner() external view returns (address)",
            "function eip712Domain() external view returns (bytes1 fields, string name, string version, uint256 chainId, address verifyingContract, bytes32 salt, uint256[] extensions)",
            "function getListingMessageHash(uint256 _type, string _dataIdentifier, address _user, uint256 _feeInToken, uint256 _deadline) external view returns (bytes32)"
        ];
        
        // Create provider
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // Create contract instance
        const contract = new ethers.Contract(contractAddress, abi, provider);
        
        console.log("=== COMPREHENSIVE SIGNATURE DEBUG ===");
        
        // 1. Check trustedSigner
        const trustedSigner = await contract.trustedSigner();
        console.log("1. Contract trustedSigner:", trustedSigner);
        
        // 2. Check EIP-712 domain
        const eip712Domain = await contract.eip712Domain();
        console.log("2. Contract EIP-712 domain:", {
            fields: eip712Domain.fields,
            name: eip712Domain.name,
            version: eip712Domain.version,
            chainId: eip712Domain.chainId.toString(),
            verifyingContract: eip712Domain.verifyingContract,
            salt: eip712Domain.salt,
            extensions: eip712Domain.extensions
        });
        
        // 3. Test data (same as your frontend)
        const testData = {
            listingType: 0,
            dataIdentifier: 'mock://mock_metadata_1755048974369_glaepa62n',
            userAddress: '0x9149cBaE3C32Ceca4Cc2cEfbE638c133902B9e8f',
            feeInToken: ethers.parseEther("10"),
            deadline: 1755052634
        };
        
        console.log("3. Test data:", testData);
        
        // 4. Get the contract's message hash
        const contractHash = await contract.getListingMessageHash(
            testData.listingType,
            testData.dataIdentifier,
            testData.userAddress,
            testData.feeInToken,
            testData.deadline
        );
        console.log("4. Contract's message hash:", contractHash);
        
        // 5. Generate our own hash for comparison
        const domain = {
            name: eip712Domain.name,
            version: eip712Domain.version,
            chainId: Number(eip712Domain.chainId),
            verifyingContract: eip712Domain.verifyingContract,
        };
        
        const types = {
            Listing: [
                { name: 'listingType', type: 'uint256' },
                { name: 'dataIdentifier', type: 'string' },
                { name: 'userAddress', type: 'address' },
                { name: 'feeInToken', type: 'uint256' },
                { name: 'deadline', type: 'uint256' },
            ],
        };
        
        const value = {
            listingType: testData.listingType,
            dataIdentifier: testData.dataIdentifier,
            userAddress: testData.userAddress,
            feeInToken: testData.feeInToken,
            deadline: testData.deadline,
        };
        
        console.log("5. Our EIP-712 domain:", domain);
        console.log("6. Our types:", types);
        console.log("7. Our value:", value);
        
        // 8. Generate our hash
        const ourHash = ethers.TypedDataEncoder.hash(domain, types, value);
        console.log("8. Our generated hash:", ourHash);
        
        // 9. Compare hashes
        console.log("9. Hash comparison:");
        console.log("   Contract hash:", contractHash);
        console.log("   Our hash:    ", ourHash);
        console.log("   Match:       ", contractHash === ourHash);
        
        if (contractHash !== ourHash) {
            console.log("\n❌ HASH MISMATCH DETECTED!");
            console.log("The contract's hash and our hash don't match.");
            console.log("This means our EIP-712 domain or data structure is incorrect.");
        } else {
            console.log("\n✅ HASH MATCH CONFIRMED!");
            console.log("Our hash generation matches the contract's hash.");
        }
        
    } catch (error) {
        console.error("Error in debugging:", error);
    }
}

// Run the debug
debugSignatureMismatch().catch(console.error);
