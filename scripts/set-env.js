const fs = require('fs');
const path = require('path');

// Ruta del archivo .env
const envPath = path.resolve(__dirname, '../.env');
const envExamplePath = path.resolve(__dirname, '../.env.example');

// Leer archivo .env o usar .env.example si no existe
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
} else if (fs.existsSync(envExamplePath)) {
  console.log('[set-env.js] .env no encontrado, usando .env.example por defecto');
  envContent = fs.readFileSync(envExamplePath, 'utf8');
}

// Parsear variables clave=valor
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...values] = trimmed.split('=');
    if (key) {
      envVars[key.trim()] = values.join('=').trim();
    }
  }
});

// Valores con defaults seguros
const useMocks = (process.env.USE_MOCKS || envVars.USE_MOCKS || 'true').toLowerCase() === 'true';
const apiMs1Url = process.env.API_MS1_URL || envVars.API_MS1_URL || 'http://localhost:3000/api/v1';
const apiMs5Url = process.env.API_MS5_URL || envVars.API_MS5_URL || 'http://localhost:8005/api/v1';
const mfe1CrisisUrl = process.env.MFE1_CRISIS_URL || envVars.MFE1_CRISIS_URL || 'http://localhost:4201/remoteEntry.js';
const mfe2FlotasUrl = process.env.MFE2_FLOTAS_URL || envVars.MFE2_FLOTAS_URL || 'http://localhost:4202/remoteEntry.js';
const mfe3InventarioUrl = process.env.MFE3_INVENTARIO_URL || envVars.MFE3_INVENTARIO_URL || 'http://localhost:4203/remoteEntry.js';

const targetDir = path.resolve(__dirname, '../src/environments');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Generar environment.ts (desarrollo)
const envFileContent = `// GENERADO AUTOMÁTICAMENTE POR scripts/set-env.js DESDE .env
// NO EDITAR MANUALMENTE ESTE ARCHIVO. Modifica el archivo .env en la raíz.

export const environment = {
  production: false,
  useMocks: ${useMocks},
  apiMs1Url: '${apiMs1Url}',
  apiMs5Url: '${apiMs5Url}',
  mfe1CrisisUrl: '${mfe1CrisisUrl}',
  mfe2FlotasUrl: '${mfe2FlotasUrl}',
  mfe3InventarioUrl: '${mfe3InventarioUrl}'
};
`;

// Generar environment.prod.ts (producción)
const envProdFileContent = `// GENERADO AUTOMÁTICAMENTE POR scripts/set-env.js DESDE .env
// NO EDITAR MANUALMENTE ESTE ARCHIVO. Modifica el archivo .env en la raíz.

export const environment = {
  production: true,
  useMocks: ${useMocks},
  apiMs1Url: '${apiMs1Url}',
  apiMs5Url: '${apiMs5Url}',
  mfe1CrisisUrl: '${mfe1CrisisUrl}',
  mfe2FlotasUrl: '${mfe2FlotasUrl}',
  mfe3InventarioUrl: '${mfe3InventarioUrl}'
};
`;

fs.writeFileSync(path.join(targetDir, 'environment.ts'), envFileContent);
fs.writeFileSync(path.join(targetDir, 'environment.prod.ts'), envProdFileContent);

console.log('[set-env.js] ✅ src/environments/environment.ts sincronizado con .env (useMocks=' + useMocks + ')');
