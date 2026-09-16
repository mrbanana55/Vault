/** @type {import('@electron-forge/shared-types').ForgeConfig} */
module.exports = {
  packagerConfig: {
    name: 'Vault',
    executableName: 'Vault',
    appBundleId: 'com.vault.app',
    icon: './assets/VaultLogo',
    asar: {
      unpack: '**/better-sqlite3/**'
    },
    ignore: (file) => {
      if (!file) return false;
      const ignoredPaths = [
        /^\/src($|\/)/,
        /^\/specs($|\/)/,
        /^\/docs($|\/)/,
        /^\/\.specify($|\/)/,
        /^\/\.agents($|\/)/,
        /^\/\.git($|\/)/,
        /^\/\.github($|\/)/,
        /^\/scripts($|\/)/,
        /^\/out($|\/)/,
        /^\/tsconfig.*\.json$/,
        /^\/vite\.config\.ts$/,
        /^\/vitest\.config\.ts$/,
        /^\/tailwind\.config\.cjs$/,
        /^\/postcss\.config\.cjs$/,
        /^\/\.DS_Store$/
      ];
      return ignoredPaths.some((regex) => regex.test(file));
    }
  },
  rebuildConfig: {
    onlyModules: ['better-sqlite3']
  },
  makers: [
    {
      name: '@electron-forge/maker-dmg',
      config: {
        name: 'Vault',
        icon: './assets/VaultLogo.icns',
        iconSize: 128
      }
    },
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'vault',
        setupExe: 'Vault-Setup.exe',
        setupIcon: './assets/VaultLogo.ico'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32']
    }
  ]
};
