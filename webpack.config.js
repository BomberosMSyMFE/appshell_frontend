const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

const mfConfig = withModuleFederationPlugin({
  // Remotos cargados de forma 100% dinámica en runtime mediante loadRemoteModule.
  // Se deja 'remotes' vacío para evitar declaraciones estáticas redundantes.
  remotes: {},

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
});

mfConfig.output = {
  ...mfConfig.output,
  scriptType: 'module',
};

module.exports = mfConfig;
