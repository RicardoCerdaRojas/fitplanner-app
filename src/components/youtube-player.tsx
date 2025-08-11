
'use client';

import * as React from 'react';
import YouTube from 'react-youtube';
import type { YouTubePlayer as YouTubePlayerType } from 'react-youtube'; // Importamos el tipo

// --- PASO 1: Definir las opciones del reproductor ---
// Estas opciones le dicen a la API de YouTube cómo comportarse.
const playerOptions = {
  height: '100%',
  width: '100%',
  playerVars: {
    // https://developers.google.com/youtube/player_parameters
    autoplay: 1, // Le pedimos que intente reproducir automáticamente
    controls: 1, // Mostramos los controles del reproductor
    rel: 0,      // No mostramos videos relacionados al final
    showinfo: 0, // Ocultamos información como el título del video (ya lo tenemos en el modal)
    modestbranding: 1, // Usamos un branding de YouTube más discreto
  },
};

interface YouTubePlayerProps {
  videoId: string;
}

// --- PASO 2: Crear el componente reproductor ---
export const YouTubePlayer = ({ videoId }: YouTubePlayerProps) => {
  
  // Esta es la función clave. Se ejecuta cuando la API de YouTube confirma que el reproductor está listo.
  const onPlayerReady = (event: { target: YouTubePlayerType }) => {
    // Al recibir la confirmación, le damos la orden explícita de reproducir el video.
    // Esto resuelve los problemas de autoplay en la mayoría de navegadores.
    event.target.playVideo();
  };

  const onPlayerError = (event: { data: number }) => {
    console.error('YouTube Player Error:', event.data);
    // Aquí podríamos manejar diferentes tipos de errores si fuera necesario.
  };

  return (
    <div className="aspect-video bg-black">
      <YouTube
        videoId={videoId}
        opts={playerOptions}
        onReady={onPlayerReady}
        onError={onPlayerError}
        className="w-full h-full"
      />
    </div>
  );
};
