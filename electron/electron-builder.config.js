/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: 'com.odwrotnamapa.app',
  productName: 'Odwrotna Mapa',
  directories: {
    output: 'dist',
    buildResources: 'assets',
  },
  files: [
    'build/**/*',
    'app/**/*',
    'generated/**/*',
    'package.json',
    // Platform runtime + plugins, prepared by `capacitor-electron vendor`.
    { from: 'vendor/node_modules', to: 'node_modules' },
  ],
  linux: {
    target: ['AppImage', 'deb'],
    category: 'Utility',
    icon: 'assets/icon.png',
  },
};
