// =====================================
// FACELANDMARKER
// =====================================

// Importa las herramientas necesarias de MediaPipe.
// - FaceLandmarker: detecta puntos clave de la cara.
// - FilesetResolver: prepara y carga los archivos necesarios del modelo.
//
// Estas funciones vienen de la librería oficial de MediaPipe Tasks Vision

import {
  FaceLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

// Variables globales para poder usar el detector desde otras partes del proyecto
// faceLandmarker: guarda la instancia del detector facial
// faceLandmarkerReady: indica si ya está listo para usarse
// faceLandmarkerError: indica si hubo un error al cargarlo
window.faceLandmarker = null;
window.faceLandmarkerReady = false;
window.faceLandmarkerError = false;

// Carga y configura el detector facial de MediaPipe
async function setupFaceLandmarker() {
  try {
    // Prepara los archivos base que necesita MediaPipe para funcionar
    // Se cargan desde la carpeta wasm de la librería
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );

    // Crea el detector facial con la configuración elegida
    window.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath:
          // El archivo .task es el modelo oficial de MediaPipe que detecta los puntos de la cara
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task", 
          
          // Intenta usar la GPU para mejorar el rendimiento.
          delegate: "GPU"
      },

      // Indica que el modelo se va a usar con vídeo en tiempo real.
      runningMode: "VIDEO",

      // Solo detecta una cara
      numFaces: 1,

      
      // Activa la lectura de movimientos faciales (sonrisa, boca abierta, etc.)
      outputFaceBlendshapes: true
    });

    // Indica que todo se ha cargado correctamente
    window.faceLandmarkerReady = true;
    console.log("FaceLandmarker listo");
  } catch (error) {
    // Si falla la carga, guarda el error para poder controlarlo después
    window.faceLandmarkerError = true;
    console.error("Error cargando FaceLandmarker:", error);
  }
}

// Inicia la carga del detector facial al abrir el archivo
setupFaceLandmarker();