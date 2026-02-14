const { getDefaultConfig } = require('@expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, '..');

const config = getDefaultConfig(projectRoot);

// Only watch files within the app directory
config.watchFolders = [projectRoot];

// Add extra node modules resolution paths if needed
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Ignore certain file extensions and directories
config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json', 'mjs', 'cjs'];
config.resolver.assetExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ttf', 'otf', 'woff', 'woff2'];

// Exclude unnecessary directories from watcher
config.resolver.blockList = exclusionList([
  /.*\/node_modules\/.*\/node_modules\/.*/, // Exclude nested node_modules
  /.*\/.git\/.*/,
  /.*\/.next\/.*/,
  /.*\/dist\/.*/,
  /.*\/build\/.*/,
]);

module.exports = config;