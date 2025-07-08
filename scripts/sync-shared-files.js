const fs = require('fs-extra');
const path = require('path');

// This script syncs shared routes from the `packages/ui` directory
// into the individual app directories. It's designed to be run from the root
// of an app's package (e.g., `apps/kristinamitrovic`).

// --- Configuration ---
// Note: This script is designed to be run from the root of an app's package.
const repoRoot = path.resolve(process.cwd(), '../..');
const packagesUiDir = path.resolve(repoRoot, 'packages/ui/src');
const packagesUiRoutes = path.join(packagesUiDir, 'routes');

const appPath = process.cwd();
const appName = path.basename(appPath);
const appRootDir = path.join(appPath, 'app');

// --- Helper Functions ---

/**
 * Recursively copies files from source to destination, validating TypeScript/TSX files
 * to prevent relative imports.
 * @param {string} src - The source path.
 * @param {string} dest - The destination path.
 */
function copyAndTransform(src, dest) {
    const stats = fs.statSync(src);

    if (stats.isDirectory()) {
        fs.ensureDirSync(dest);
        fs.readdirSync(src).forEach(child => {
            copyAndTransform(path.join(src, child), path.join(dest, child));
        });
    } else {
        // For .ts/.tsx files, validate there are no relative imports
        if (src.endsWith('.ts') || src.endsWith('.tsx')) {
            const content = fs.readFileSync(src, 'utf8');

            // This regex finds import/export statements that use relative paths (./ or ../)
            // It covers:
            //   - import defaultExport from './...'
            //   - import { namedExport } from '../...'
            //   - import * as namespace from './...'
            //   - import './for-side-effects'
            //   - export { namedExport } from '../...'
            const relativeImportRegex = /^\s*(?:import|export)(?:.*from)?\s*['"](\.\.?\/.*?)['"]/gm;
            const match = relativeImportRegex.exec(content);

            if (match) {
                // If a relative import is found, throw a detailed error to stop the build.
                throw new Error(
                    `\n\n[Sync Error] Found a relative import in a shared UI file.\n` +
                    `  - File: ${path.relative(repoRoot, src)}\n` +
                    `  - Problematic Import: ${match[0].trim()}\n\n` +
                    `  To ensure component paths work correctly in all apps, please update this import to use the '@repo/ui' path alias.\n` +
                    `  For example: import { MyComponent } from '@repo/ui/components/MyComponent';\n`
                );
            }
        }
        
        // If validation passes (or it's not a TS/TSX file), copy it
        fs.copyFileSync(src, dest);
    }
}


// --- Main Sync Logic ---

console.log(`Syncing shared files for ${appName}...`);

if (!fs.existsSync(appRootDir)) {
    console.log(`'app' directory not found in ${appName}. Skipping sync.`);
    process.exit(0);
}

// Sync all shared routes from packages/ui/src/routes
if (fs.existsSync(packagesUiRoutes)) {
    console.log('Syncing shared routes...');

    fs.readdirSync(packagesUiRoutes).forEach(item => {
        const sourcePath = path.join(packagesUiRoutes, item);
        const targetPath = path.join(appRootDir, item);
        
        // If the target exists and is a symlink, remove it before copying.
        // This prevents errors when a directory needs to overwrite a symlink.
        if (fs.existsSync(targetPath)) {
            const stats = fs.lstatSync(targetPath);
            if (stats.isSymbolicLink()) {
                fs.removeSync(targetPath);
            }
        }
        
        copyAndTransform(sourcePath, targetPath);
    });
    console.log('Finished syncing shared routes.');

} else {
    throw new Error(`Shared routes directory not found in packages/ui/src: ${packagesUiRoutes}`);
}

console.log(`Finished syncing for ${appName}.`); 