import path from 'node:path';
import fs from 'node:fs';
import webpack from 'webpack';
import getPublicLibConfig from '../webpack.config.js';

globalThis.DATA_ROOT = process.env.DATA_ROOT || '/tmp/st-data';

const config = getPublicLibConfig({ forceDist: true, pruneCache: false });
const compiler = webpack(config);

console.log('Building lib.js for Vercel deployment...');

compiler.run((err, stats) => {
    if (err) {
        console.error('Webpack compilation error:', err);
        process.exit(1);
    }

    const output = stats?.toString(config.stats);
    if (output) {
        console.log(output);
    }

    const outputDir = config.output.path;
    const outputFile = config.output.filename;
    const sourcePath = path.join(outputDir, outputFile);

    // Overwrite the raw public/lib.js with the compiled bundle.
    // Vercel serves static files from public/ directly, bypassing
    // Express middleware, so the compiled bundle must replace the source.
    const publicLibPath = path.resolve('public/lib.js');

    if (!fs.existsSync(sourcePath)) {
        console.error(`Output file not found: ${sourcePath}`);
        compiler.close(() => process.exit(1));
        return;
    }

    // Backup original manifest headers for dynamic imports
    const original = fs.readFileSync(publicLibPath, 'utf-8');
    const manifestMatch = original.match(/\/\*\*[\s\S]*?\*\/\s*/);
    const header = manifestMatch ? manifestMatch[0] : '';

    const compiled = fs.readFileSync(sourcePath, 'utf-8');
    fs.writeFileSync(publicLibPath, header + compiled);
    console.log(`Overwrote public/lib.js with compiled bundle (${compiled.length} bytes)`);

    compiler.close(() => {
        console.log('Build complete.');
        process.exit(0);
    });
});
