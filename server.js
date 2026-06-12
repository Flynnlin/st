#!/usr/bin/env node
import fs from 'node:fs';
import { CommandLineParser } from './src/command-line.js';
import { serverDirectory } from './src/server-directory.js';

// Vercel serverless: override DATA_ROOT to a writable location.
const argv = [...process.argv];
if (process.env.VERCEL) {
    const dataRoot = '/tmp/st-data';
    fs.mkdirSync(dataRoot, { recursive: true });
    argv.push('--dataRoot', dataRoot);
    console.log(`Vercel environment detected. Using data root: ${dataRoot}`);
}

console.log(`Node version: ${process.version}. Running in ${process.env.NODE_ENV} environment. Server directory: ${serverDirectory}`);

// config.yaml will be set when parsing command line arguments
const cliArgs = new CommandLineParser().parse(argv);
globalThis.DATA_ROOT = cliArgs.dataRoot;
globalThis.COMMAND_LINE_ARGS = cliArgs;
process.chdir(serverDirectory);

try {
    await import('./src/server-main.js');
} catch (error) {
    console.error('A critical error has occurred while starting the server:', error);
}
