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
    const targetDir = path.resolve('public/dist');
    const targetPath = path.join(targetDir, outputFile);

    if (!fs.existsSync(sourcePath)) {
        console.error(`Output file not found: ${sourcePath}`);
        compiler.close(() => process.exit(1));
        return;
    }

    fs.mkdirSync(targetDir, { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Copied to ${targetPath}`);

    compiler.close(() => {
        console.log('Build complete.');
        process.exit(0);
    });
});
