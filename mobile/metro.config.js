const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);



// Block parent Next.js node_modules and .next from polluting the Metro file map
const parentNodeModules = path.resolve(projectRoot, '..', 'node_modules');
const parentNext = path.resolve(projectRoot, '..', '.next');

config.resolver.blockList = [
  new RegExp(`^${parentNodeModules.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*`),
  new RegExp(`^${parentNext.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*`),
];

module.exports = config;
