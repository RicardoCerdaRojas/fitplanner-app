
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
    ],
  },
};

export default nextConfig;
