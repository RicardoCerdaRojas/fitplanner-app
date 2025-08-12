
/** @type {import('next').NextConfig} */

const isProduction = process.env.NODE_ENV === 'production';

// La configuración correcta y condicional por entorno.
// En desarrollo ('development'), usa el cargador por defecto de Next.js que funciona con archivos locales.
// En producción ('production'), usa nuestro loader personalizado para la optimización de Firebase.
const nextConfig = {
  images: {
    loader: isProduction ? 'custom' : 'default',
    loaderFile: isProduction ? './loader.js' : undefined,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      // --- SOLUCIÓN: Añadir un patrón más genérico para capturar cualquier dominio de imagen ---
      // Advertencia: Esto es menos seguro. Deberíamos reemplazarlo con el hostname específico
      // una vez que lo identifiquemos en producción.
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
