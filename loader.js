'use client';

// Este loader personalizado simplemente devuelve la ruta de la imagen original.
// Es la forma más robusta de asegurar que las imágenes locales funcionen
// tanto en el entorno de desarrollo como en producción con Firebase App Hosting,
// que tiene su propio sistema de optimización de imágenes.
export default function firebaseImageLoader({ src, width, quality }) {
  return src;
}
