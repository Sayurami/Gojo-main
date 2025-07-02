const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { File } = require('megajs');
const axios = require('axios');
const extractZip = require('extract-zip');
const { exec } = require('child_process');
const sevenBin = require('7zip-bin');

// MEGA Link Directly Here:
const megaLink = 'https://mega.nz/file/LIdCFQRY#2bWkhzfGJ3hF3AxZKp43PHRshN8WM2WlRxl48ChpQsc';

// Utility: Save buffer to disk
async function saveToDisk(buffer, outputPath) {
    fs.writeFileSync(outputPath, buffer);
    console.log(`[✅] Saved to ${outputPath}`);
}

// Process MEGA File
async function processMegaFile(url) {
    console.log(`[📦] Processing MEGA link: ${url}`);

    const file = File.fromURL(url);
    await file.loadAttributes();
    console.log(`[⬇️] Downloading: ${file.name}`);

    const buffer = await file.downloadBuffer();
    const downloadsDir = path.join(__dirname, 'downloads');

    if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir);
    }

    const outputPath = path.join(downloadsDir, file.name);
    await saveToDisk(buffer, outputPath);

    // Determine archive type
    if (file.name.endsWith('.zip')) {
        const extractPath = outputPath.replace(/\.zip$/i, '');
        await extractZip(outputPath, { dir: extractPath });
        console.log(`[🗂️] Extracted ZIP to ${extractPath}`);
    } else if (file.name.endsWith('.7z')) {
        const extractPath = outputPath.replace(/\.7z$/i, '');
        const command = `"${sevenBin.path7za}" x "${outputPath}" -o"${extractPath}" -y`;
        await execAsync(command);
        console.log(`[🗂️] Extracted 7z to ${extractPath}`);
    } else {
        console.warn(`[⚠️] Unknown archive format: ${file.name}`);
    }

    console.log('[✅] Process completed.');
}

// Promisify exec
function execAsync(command) {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err) reject(stderr || stdout || err);
            else resolve(stdout);
        });
    });
}

// Main Run
(async () => {
    try {
        console.log('[🚀] Starting download & extract...');
        await processMegaFile(megaLink);
    } catch (err) {
        console.error('[❌] Error:', err.message || err);
    }
})();
