const fs = require('fs');
const path = require('path');

// Extract ABIs from compiled contracts
function extractABIs() {
    const artifactsDir = './artifacts/contracts';
    const outputDir = './';
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Extract Escrow ABI
    try {
        const escrowArtifact = require('./artifacts/contracts/Escrow.sol/Escrow.json');
        fs.writeFileSync(
            path.join(outputDir, 'escrow_abi.json'),
            JSON.stringify(escrowArtifact.abi, null, 2)
        );
        console.log('✅ Escrow ABI extracted to escrow_abi.json');
    } catch (error) {
        console.log('❌ Failed to extract Escrow ABI:', error.message);
    }
    
    // Extract EscrowFactory ABI
    try {
        const factoryArtifact = require('./artifacts/contracts/EscrowFactory.sol/EscrowFactory.json');
        fs.writeFileSync(
            path.join(outputDir, 'escrow_factory_abi.json'),
            JSON.stringify(factoryArtifact.abi, null, 2)
        );
        console.log('✅ EscrowFactory ABI extracted to escrow_factory_abi.json');
    } catch (error) {
        console.log('❌ Failed to extract EscrowFactory ABI:', error.message);
    }
    
    // Extract Token ABI
    try {
        const tokenArtifact = require('./artifacts/contracts/Token.sol/PlatformToken.json');
        fs.writeFileSync(
            path.join(outputDir, 'token_abi.json'),
            JSON.stringify(tokenArtifact.abi, null, 2)
        );
        console.log('✅ PlatformToken ABI extracted to token_abi.json');
    } catch (error) {
        console.log('❌ Failed to extract PlatformToken ABI:', error.message);
    }
    
    // Extract Treasury ABI
    try {
        const treasuryArtifact = require('./artifacts/contracts/Treasury.sol/Treasury.json');
        fs.writeFileSync(
            path.join(outputDir, 'treasury_abi.json'),
            JSON.stringify(treasuryArtifact.abi, null, 2)
        );
        console.log('✅ Treasury ABI extracted to treasury_abi.json');
    } catch (error) {
        console.log('❌ Failed to extract Treasury ABI:', error.message);
    }
}

extractABIs();
