const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// Optionale Privy-Abhängigkeiten (Solana, Farcaster, Account Abstraction), die LIQUODA nicht nutzt
const UNUSED_OPTIONAL_MODULES = [
  '@solana/kit',
  '@solana-program/memo',
  '@solana-program/token',
  '@solana-program/system',
  '@farcaster/mini-app-solana',
  '@abstract-foundation/agw-client',
  'permissionless',
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    for (const mod of UNUSED_OPTIONAL_MODULES) {
      config.resolve.alias[mod] = false;
    }
    return config;
  },
};

module.exports = withNextIntl(nextConfig);
