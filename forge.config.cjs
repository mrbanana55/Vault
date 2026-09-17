/** @type {import('@electron-forge/shared-types').ForgeConfig} */
module.exports = {
  packagerConfig: {
    name: "Vault",
    executableName: "Vault",
    appBundleId: "com.vault.app",
    icon: "./assets/VaultLogo",
    asar: {
      unpack: "**/better-sqlite3/**",
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
        /^\/\.DS_Store$/,
      ];
      return ignoredPaths.some((regex) => regex.test(file));
    },
  },
  rebuildConfig: {
    onlyModules: ["better-sqlite3"],
  },
  makers: [
    {
      name: "@electron-forge/maker-dmg",
      config: {
        name: "Vault",
        icon: "./assets/VaultLogo.icns",
        authors: "Andres Delgado",
        iconSize: 128,
      },
    },
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "vault",
        authors: "Andres Delgado",
        setupExe: "Vault-Setup.exe",
        setupIcon: "./assets/VaultLogo.ico",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      authors: "Andres Delgado",
      platforms: ["darwin", "win32"],
    },
  ],
};
