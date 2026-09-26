// Exportiert ABI und Bytecode für das Backend (lib/chain/LiquodaProjectToken.json)
const fs = require('node:fs');
const path = require('node:path');
const artifact = require('../artifacts/contracts/LiquodaProjectToken.sol/LiquodaProjectToken.json');
const out = { contractName: artifact.contractName, abi: artifact.abi, bytecode: artifact.bytecode };
const target = path.resolve(__dirname, '../../lib/chain/LiquodaProjectToken.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(out, null, 2));
console.log('exportiert nach', path.relative(process.cwd(), target));
