// Metro config for an Expo app inside an npm-workspaces monorepo.
//
// Two things make the shared package work from here:
//  1. watchFolders includes the repo root, so Metro can see + serve files in
//     packages/shared (which ships raw TypeScript and is transpiled by Metro).
//  2. nodeModulesPaths includes both the app's and the workspace root's node_modules
//     so hoisted dependencies resolve.
// Package "exports" resolution is enabled so @reelworx/shared's exports map (the "."
// entry) is honored — and the server-only "./server" entry is simply never imported
// from the mobile bundle.

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
