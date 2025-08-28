import { ethers } from 'ethers';

// Debug the exact data flow from signature generation to contract call
async function debugDataFlow() {
    try {
        console.log("=== COMPREHENSIVE DATA FLOW DEBUG ===");
        
        // 1. Simulate the exact same data your frontend sends
        const frontendData = {
            listingType: 0,
            dataIdentifier: 'mock://mock_metadata_1755048974369_glaepa62n',
            userAddress: '0x9149cBaE3C32Ceca4Cc2cEfbE638c133902B9e8f',
            feeInToken: '10000000000000000000', // String as sent from frontend
            deadline: 1755052634,
            chainId: 11155111,
            verifyingContract: '0x394d064C4E22F6D6D2C0bC0673BA6dFb88BdF679'
        };
        
        console.log("1. Frontend data (exact format):", frontendData);
        console.log("   Data types:", {
            listingType: typeof frontendData.listingType,
            dataIdentifier: typeof frontendData.dataIdentifier,
            userAddress: typeof frontendData.userAddress,
            feeInToken: typeof frontendData.feeInToken,
            deadline: typeof frontendData.deadline,
            chainId: typeof frontendData.chainId,
            verifyingContract: typeof frontendData.verifyingContract
        });
        
        // 2. Simulate what the Netlify function does
        const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
        const signer = new ethers.Wallet("e5489ca9cf2f168b1047545edf62344f2bf3b75ad9a94192492231f5920d5160"); // Replace with your actual private key
        
        // Process data exactly as Netlify function does
        const processedData = {
            listingType: parseInt(frontendData.listingType),
            dataIdentifier: frontendData.dataIdentifier,
            userAddress: frontendData.userAddress,
            feeInToken: BigInt(frontendData.feeInToken),
            deadline: parseInt(frontendData.deadline)
        };
        
        console.log("\n2. Processed data (after Netlify processing):", processedData);
        console.log("   Data types:", {
            listingType: typeof processedData.listingType,
            dataIdentifier: typeof processedData.dataIdentifier,
            userAddress: typeof processedData.userAddress,
            feeInToken: typeof processedData.feeInToken,
            deadline: typeof processedData.deadline
        });
        
        // 3. Create EIP-712 domain (exact same as Netlify function)
        const domain = {
            name: 'ListingManager',
            version: '1',
            chainId: 11155111,
            verifyingContract: frontendData.verifyingContract,
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
        
        console.log("\n3. EIP-712 domain:", domain);
        console.log("   Types:", types);
        
        // 4. Generate signature
        const signature = await signer.signTypedData(domain, types, processedData);
        console.log("\n4. Generated signature:", signature);
        console.log("   Signature length:", signature.length);
        console.log("   Signature starts with 0x:", signature.startsWith('0x'));
        
        // 5. Verify signature locally
        const messageHash = ethers.TypedDataEncoder.hash(domain, types, processedData);
        const recoveredAddress = ethers.recoverAddress(messageHash, signature);
        console.log("\n5. Local verification:");
        console.log("   Message hash:", messageHash);
        console.log("   Recovered address:", recoveredAddress);
        console.log("   Expected address:", await signer.getAddress());
        console.log("   Verification successful:", recoveredAddress === await signer.getAddress());
        
        // 6. Simulate what gets sent back to frontend
        const netlifyResponse = { signature };
        console.log("\n6. Netlify response:", netlifyResponse);
        
        // 7. Simulate what frontend receives and processes
        const receivedSignature = netlifyResponse.signature;
        console.log("\n7. Frontend received signature:");
        console.log("   Value:", receivedSignature);
        console.log("   Type:", typeof receivedSignature);
        console.log("   Length:", receivedSignature.length);
        console.log("   Starts with 0x:", receivedSignature.startsWith('0x'));
        
        // 8. Simulate what gets sent to contract
        const contractArgs = [
            processedData.listingType,        // uint256
            processedData.dataIdentifier,     // string
            processedData.feeInToken,         // uint256 (BigInt)
            processedData.deadline,           // uint256
            receivedSignature                 // bytes
        ];
        
        console.log("\n8. Contract call arguments:");
        console.log("   Arguments:", contractArgs);
        console.log("   Argument types:", contractArgs.map(arg => typeof arg));
        console.log("   Argument values:", contractArgs.map(arg => {
            if (typeof arg === 'bigint') return arg.toString();
            if (typeof arg === 'string') return arg;
            return arg;
        }));
        
        // 9. Test signature integrity
        console.log("\n9. Signature integrity test:");
        const originalHash = ethers.TypedDataEncoder.hash(domain, types, processedData);
        const testRecovery = ethers.recoverAddress(originalHash, receivedSignature);
        console.log("   Original hash:", originalHash);
        console.log("   Test recovery:", testRecovery);
        console.log("   Integrity check:", testRecovery === await signer.getAddress());
        
        // 10. Test with exact same data as working test
        console.log("\n10. Comparison with working test:");
        const workingData = {
            listingType: 0,
            dataIdentifier: 'mock://mock_metadata_1755048974369_glaepa62n',
            userAddress: '0x9149cBaE3C32Ceca4Cc2cEfbE638c133902B9e8f',
            feeInToken: ethers.parseEther("10"),
            deadline: 1755052634
        };
        
        const workingSignature = await signer.signTypedData(domain, types, workingData);
        const workingHash = ethers.TypedDataEncoder.hash(domain, types, workingData);
        const workingRecovery = ethers.recoverAddress(workingHash, workingSignature);
        
        console.log("   Working data:", workingData);
        console.log("   Working signature:", workingSignature);
        console.log("   Working hash:", workingHash);
        console.log("   Working recovery:", workingRecovery);
        console.log("   Working verification:", workingRecovery === await signer.getAddress());
        
        // 11. Check for any differences
        console.log("\n11. Data comparison:");
        console.log("   listingType same:", processedData.listingType === workingData.listingType);
        console.log("   dataIdentifier same:", processedData.dataIdentifier === workingData.dataIdentifier);
        console.log("   userAddress same:", processedData.userAddress === workingData.userAddress);
        console.log("   feeInToken same:", processedData.feeInToken === workingData.feeInToken);
        console.log("   deadline same:", processedData.deadline === workingData.deadline);
        console.log("   feeInToken comparison:", {
            processed: processedData.feeInToken.toString(),
            working: workingData.feeInToken.toString(),
            equal: processedData.feeInToken === workingData.feeInToken
        });
        
        console.log("\n=== END DATA FLOW DEBUG ===");
        
    } catch (error) {
        console.error("Error in data flow debug:", error);
    }
}

// Run the debug
debugDataFlow().catch(console.error);
