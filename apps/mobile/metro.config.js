// Metro config — pozwala bundlować źródła z packages/shared (poza katalogiem aplikacji).
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// obserwuj cały monorepo (żeby zmiany w packages/shared odświeżały bundle)
config.watchFolders = [repoRoot];

// szukaj modułów najpierw lokalnie, potem w root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(repoRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
