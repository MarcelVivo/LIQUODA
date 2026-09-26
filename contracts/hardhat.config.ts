import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

// Deployment erfolgt nicht über Hardhat, sondern aus dem Backend (lib/chain) mit viem.
// Hardhat dient hier nur zum Kompilieren und Testen.
const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  paths: { sources: './contracts', tests: './test', artifacts: './artifacts', cache: './cache' },
};

export default config;
