# LABORATORIO HEALTHYSMILE 

Este proyecto forma parte de la asignatura Diseño de Aplicaciones Interactivas (UOC 2026).

Se trata de una aplicación interactiva de escritorio que utiliza la cámara para detectar la apertura de la boca y generar una experiencia visual basada en el cepillado dental, todo ello ambientado en una temática de Halloween.


# DESCRIPCIÓN

La aplicación propone una experiencia lúdica dirigida a público infantil, en la que el usuario debe abrir la boca para activar un “cepillado mágico”.

- Boca cerrada --> se muestra un filtro de Halloween (labios + colmillos)
- Boca abierta --> se activan partículas, espuma y animaciones simulando el cepillado
- Objetivo --> mantener la boca abierta durante 60 segundos

El objetivo es fomentar hábitos saludables de forma divertida mediante interacción visual.


# TECNOLOGÍAS UTILIZADAS

p5.js --> gráficos y animaciones 2D
MediaPipe FaceLandmarker --> detección de landmarks faciales y apertura de la boca
Electron --> conversión a aplicación de escritorio
HTML, CSS y JavaScript --> estructura y estilos 


# FUNCIONAMIENTO

1. Al iniciar la app aparece una pantalla de carga.
2. El usuario pulsa el botón “Empezar experiencia”.
3. Se activa la cámara.
4. El sistema detecta la cara y analiza la apertura de la boca.
5. Según el estado:
    - Boca cerrada --> se muestra un filtro Halloween sobre la boca con colmillos
    - Boca abierta --> cepillado mágico con efectos
6. Se va acumulando tiempo mientras la boca permanece abierta.
7. Al llegar a 60 segundos se completa el reto:
    - aparece una pantalla final
    - se activa una animación de confeti
8. El usuario puede repetir la experiencia.


# APLICACIÓN DE ESCRITORIO

La aplicación ha sido empaquetada con Electron:

- modo kiosko
- pantalla completa
- resolución optimizada para 1920x1080 (Full HD)

Esta versión está preparada para ejecutarse en pantalla completa.


# DISEÑO Y ESTÉTICA

La aplicación está ambientada en temática Halloween, incorporando elementos como:

- calabazas 
- murciélagos 
- niebla animada 
- partículas, espuma y brillos 

Se han utilizado fuentes personalizadas y una interfaz pensada para ser clara y atractiva.


# DETECCIÓN FACIAL

Se ha utilizado MediaPipe FaceLandmarker en lugar de ml5.js para mejorar el rendimiento y la precisión.

La apertura de la boca se calcula mediante:

- datos de expresiones faciales (blendshapes)
- o, en su defecto, distancias entre puntos (landmarks)


# EJECUCIÓN

1. Abrir un terminal

2. Instalar dependencias
npm install

3. Ejecutar la aplicación
npm start


# REQUISITOS

- Tener Node.js instalado
- Una cámara web disponible
- Permisos de cámara activados

Resolución recomendada: 1920x1080 (Full HD)


# AUTORÍA

Natalia García Vallinas
Diseño de Aplicaciones Interactivas
UOC - 2026


# NOTAS

Este proyecto ha sido desarrollado con fines académicos.
