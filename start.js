const fs = require('fs');
const path = require('path');
const { File } = require('megajs');
const extractZip = require('extract-zip');
const { exec } = require('child_process');
const sevenBin = require('7zip-bin');

// MEGA Link
const megaLink = 'https://mega.nz/file/LIdCFQRY#2bWkhzfGJ3hF3AxZKp43PHRshN8WM2WlRxl48ChpQsc';

// Save file
async function saveToDisk(buffer, outputPath) {
    fs.writeFileSync(outputPath, buffer);
    console.log(`[✅] Saved to ${outputPath}`);
}

// Move extracted folder to ./plugins/
function moveToPlugins(sourcePath) {
    const targetPath = path.join(__dirname, 'plugins');
    
    if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true });
    }
    
    fs.renameSync(sourcePath, targetPath);
    console.log('[✅] Plugins moved to ./plugins/');
}

// 7z Extract Async
function execAsync(command) {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err) reject(stderr || stdout || err);
            else resolve(stdout);
        });
    });
}

// Process MEGA file
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

    if (file.name.endsWith('.zip')) {
        const extractPath = path.join(downloadsDir, 'plugins-temp');
        await extractZip(outputPath, { dir: extractPath });
        moveToPlugins(extractPath);
    } else if (file.name.endsWith('.7z')) {
        const extractPath = path.join(downloadsDir, 'plugins-temp');
        const command = `"${sevenBin.path7za}" x "${outputPath}" -o"${extractPath}" -y`;
        
        await execAsync(`chmod +x "${sevenBin.path7za}"`); // Permission Fix
        await execAsync(command);
        moveToPlugins(extractPath);
    } else {
        console.warn(`[⚠️] Unknown archive format: ${file.name}`);
    }

    console.log('[✅] Process completed.');
}

// Main
(async () => {
    try {
        console.log('[🚀] Starting download & extract...');
        await processMegaFile(megaLink);
    } catch (err) {
        console.error('[❌] Error:', err.message || err);
    }
})();
