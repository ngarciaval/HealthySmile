/*
 * DESARROLLO DE APLICACIONES INTERACTIVAS
 * Reto 2
 * Natalia García Vallinas
 * UOC 2026
 *
 * Laboratorio HealthySmile - Halloween
 * Aplicación interactiva con cámara, detección facial y efectos gráficos.
 *
 * Boca cerrada → filtro Halloween
 * Boca abierta → cepillado mágico con partículas, espuma y brillos
 * Objetivo     → mantener la boca abierta hasta completar 60 segundos
 */

// =====================================
// FUENTES
// =====================================

// Variables para guardar las tipografías del proyecto
let fuenteTitulo;
let fuenteTexto;

// =====================================
// ESTADO GENERAL
// =====================================

// Controla si la experiencia está iniciada o no
let ini = false;

// Indica si el reto ya se ha completado
let finReto = false;

// Guarda la cámara creada con createCapture()
let cam = null;

// Variables relacionadas con la detección de la boca
let boca = 0;          // valor numérico de apertura
let abierta = false;   // indica si la boca está abierta o no
let tIni = 0;          // momento en el que empezó a abrirse
let tBoca = 0;         // tiempo que lleva abierta en este intento
let tAcum = 0;         // tiempo acumulado total del reto
let tUlt = 0;          // guarda el tiempo del frame anterior
let estado = "cerrada"; // estado actual: "cerrada" o "abierta"

// =====================================
// EFECTOS
// =====================================

// Arrays para guardar partículas y elementos animados
let parts = [];
let murcis = [];
let confs = [];
let confTop = [];

// =====================================
// UI
// =====================================

// Referencias a elementos del DOM
let txtEstado;
let txtTiempo;
let progInt;
let carga;
let musica;
let btn;
let fin;
let btnRepetir;

// Variable que guardan el último valor mostrado en la interfaz
// Se usan para no actualizar el DOM en cada frame
let ultimoEstadoTxt = "";
let ultimoTiempoTxt = "";
let ultimoProgreso = -1;

// =====================================
// CANVAS
// =====================================

// Canvas principal de p5 y canvas extra para el confeti superior
let lienzo;
let confCanvas;
let confCtx;

// =====================================
// AJUSTE DEL VÍDEO
// =====================================

// Variables que guardan cómo se adapta el vídeo al tamaño de la ventana
let posVideoX = 0;
let posVideoY = 0;
let wVideo = 0;
let hVideo = 0;

// =====================================
// RENDIMIENTO
// =====================================

// Definimos un máximo de partículas y confeti para controlar cuántos 
//elementos se dibujan y no sobrecargar
const MAX_PARTS = 180;
const MAX_CONFS = 180;
const MAX_CONFTOP = 220;

// Tiempo mínimo entre detecciones faciales (en milisegundos).
// Se usa para no ejecutar la detección en cada frame y mejorar el rendimiento.
const DETECTION_INTERVAL = 33;

// Variables para guardar la última detección y reutilizar datos
let tiempoUltimaDeteccion = 0;
let resultadoDeteccion = null;
let datosFrame = null;

// Tiempo de gracia para mantener la última cara detectada
// si falla la detección durante unos pocos frames
const TIEMPO_TOLERANCIA = 180;
let ultimaCaraDetectada = 0;
let ultimoDatosValidos = null;

// =====================================
// MOVIMIENTO DEL CEPILLO
// El cepillo se mueve usando tiempo real, para que
// mantenga la misma velocidad aunque bajen los fps
// =====================================

// Posición actual del cepillo
let cepilloX = 0;
let cepilloY = 0;
let cepilloGiro = 0;

// Dirección del movimiento en cada eje
let dirCepilloX = 1;
let dirCepilloY = 1;
let dirCepilloGiro = 1;

// Velocidad del cepillo (en píxeles y grados por segundo)
let velCepilloX = 320;
let velCepilloY = 190;
let velCepilloGiro = 280;

// =====================================
// PRELOAD
// =====================================

// Cargamos las fuentes antes de iniciar el sketch
function preload() {
  fuenteTitulo = loadFont('assets/fonts/Creepster-Regular.ttf');
  fuenteTexto = loadFont('assets/fonts/Fredoka-Regular.ttf');
}

// =====================================
// SETUP
// =====================================

function setup() {
  // Creamos el lienzo a pantalla completa
  lienzo = createCanvas(windowWidth, windowHeight);

  // Colocamos el canvas como capa fija encima del fondo
  lienzo.position(0, 0);
  lienzo.style("position", "fixed");
  lienzo.style("top", "0");
  lienzo.style("left", "0");
  lienzo.style("z-index", "5");
  lienzo.style("pointer-events", "none");

  // Guardamos en variables los elementos de la interfaz (botones, textos, etc.)
  txtEstado = document.getElementById("txtEstado");
  txtTiempo = document.getElementById("txtTiempo");
  progInt = document.getElementById("progInt");
  carga = document.getElementById("carga");
  musica = document.getElementById("musica");
  btn = document.getElementById("btn");
  fin = document.getElementById("fin");
  btnRepetir = document.getElementById("btnRepetir");

  // Preparamos el canvas extra usado para el confeti final superior
  confCanvas = document.getElementById("confetiTop");
  
  if (confCanvas) {
    confCtx = confCanvas.getContext("2d");
  } else {
    confCtx = null;
  }
  
  ajustarConfetiTop();

  // Configuramos la música de fondo (volumen y reproducción en bucle)
  if (musica) {
    musica.volume = 0.22;
    musica.loop = true;
  }

  // Asignamos los eventos de los botones
  if (btn) btn.addEventListener("click", cambiarEstado);
  if (btnRepetir) btnRepetir.addEventListener("click", repetir);

  // Creamos varios murciélagos iniciales
  for (let i = 0; i < 7; i++) {
    murcis.push(new Murci(random(width), random(40, height * 0.4), random(1.2, 2.3)));
  }

  // Actualizamos el progreso inicial
  actProg();

  // Ocultamos la pantalla de carga pasado un tiempo
  setTimeout(() => {
    if (carga) carga.classList.add("oculto");
  }, 1800);
}

// =====================================
// ACTUALIZACIÓN DE LA INTERFAZ
// =====================================

// Cambia el texto de estado solo si ha cambiado,
// para no actualizar la pantalla todo el tiempo
function setEstadoUI(txt) {
  if (!txtEstado) return;
  if (ultimoEstadoTxt === txt) return;
  ultimoEstadoTxt = txt;
  txtEstado.textContent = txt;
}

// Cambia el texto del tiempo solo si es diferente al anterior
function setTiempoUI(txt) {
  if (!txtTiempo) return;
  if (ultimoTiempoTxt === txt) return;
  ultimoTiempoTxt = txt;
  txtTiempo.textContent = txt;
}

// Actualiza la barra de progreso del reto
// solo cuando el valor cambia
function setProgresoUI(porc) {
  if (!progInt) return;

  let valor = floor(porc);
  if (ultimoProgreso === valor) return;

  ultimoProgreso = valor;
  progInt.style.width = valor + "%";
}

// =====================================
// CONTROL DE LA EXPERIENCIA
// =====================================

// Cambia entre iniciar y parar la experiencia
function cambiarEstado() {
  if (ini) {
    parar();
  } else {
    empezar();
  }
}

// Inicia la experiencia:
// activa la cámara, reinicia el juego y prepara la interfaz
function empezar() {
  ini = true;
  finReto = false;

  if (btn) btn.textContent = "Parar experiencia";
  if (fin) fin.classList.add("oculto");

  setEstadoUI("Activando cámara mágica...");
  iniciarMusica();
  resetJuego();

  // Si ya existía una cámara previa, la cerramos antes de crear otra
  if (cam) cerrarCam();

  // Creamos la captura de vídeo frontal
  cam = createCapture(
    {
      video: { facingMode: "user" },
      audio: false
    },
    () => {
      console.log("Cámara creada");
    }
  );

  cam.size(640, 480);
  cam.show();

  // Ajustamos el vídeo para que ocupe toda la pantalla
  // y se vea como un espejo
  if (cam && cam.elt) {
    let video = cam.elt;

    video.setAttribute("playsinline", "");
    video.setAttribute("autoplay", "");
    video.muted = true;

    video.style.position = "fixed";
    video.style.inset = "0";
    video.style.width = "100vw";
    video.style.height = "100vh";
    video.style.objectFit = "cover";
    video.style.transform = "scaleX(-1)";
    video.style.zIndex = "0";
    video.style.pointerEvents = "none";
    video.style.background = "#120018";

    // Cuando el vídeo ya está listo, actualizamos el mensaje
    video.onloadedmetadata = () => {
      setEstadoUI("Abre la boca para empezar a cepillar");
    };
  }

  // Guardamos el tiempo actual para calcular el tiempo entre frames
  tUlt = millis();
}

// Detiene la experiencia y reinicia el estado general
function parar() {
  ini = false;
  finReto = false;

  if (btn) btn.textContent = "Empezar experiencia";

  setEstadoUI("Juego detenido");

  resetJuego();
  cerrarCam();

  // Detenemos la música
  if (musica) {
    musica.pause();
    musica.currentTime = 0;
  }
}

// Permite repetir la experiencia después de completar el reto
function repetir() {
  if (fin) fin.classList.add("oculto");
  finReto = false;
  resetJuego();
  setEstadoUI("Abre la boca para empezar a cepillar");
}

// Reinicia todas las variables del reto y limpia los efectos
function resetJuego() {
  boca = 0;
  abierta = false;
  tIni = 0;
  tBoca = 0;
  tAcum = 0;
  tUlt = millis();
  estado = "cerrada";

  parts = [];
  confs = [];
  confTop = [];

  tiempoUltimaDeteccion = 0;
  resultadoDeteccion = null;
  datosFrame = null;
  ultimaCaraDetectada = 0;
  ultimoDatosValidos = null;

  cepilloX = 0;
  cepilloY = 0;
  cepilloGiro = 0;

  dirCepilloX = 1;
  dirCepilloY = 1;
  dirCepilloGiro = 1;

  limpiarConfetiTop();
  actProg();
}

// =====================================
// CÁMARA Y MÚSICA
// =====================================

// Cierra la cámara y detiene sus pistas de vídeo
function cerrarCam() {
  if (!cam) return;

  let pistas = [];

  if (cam.elt && cam.elt.srcObject) {
    pistas = cam.elt.srcObject.getTracks();
  }

  for (let i = 0; i < pistas.length; i++) {
    pistas[i].stop();
  }

  cam.remove();
  cam = null;
}

// Inicia la música de fondo (si está disponible)
function iniciarMusica() {
  if (!musica) return;

  musica.play().catch((e) => {
    console.error("No se pudo iniciar la música:", e);
  });
}

// Comprueba si la cámara está lista y el vídeo ya se puede usar
function camOK() {
  if (!cam) return false;
  if (!cam.elt) return false;
  if (cam.elt.readyState < 2) return false;
  if (cam.elt.videoWidth <= 0) return false;
  if (cam.elt.videoHeight <= 0) return false;
  return true;
}

// =====================================
// DRAW
// =====================================

function draw() {
  // Si la experiencia no ha empezado o la cámara no está lista,
  // dibujamos un fondo opaco
  if (!ini || !camOK()) {
    background(15, 0, 24);
  } else {
    // Si la cámara ya está visible por debajo, limpiamos el canvas
    clear();
  }

  // Dibujamos el fondo general
  dibFondo();
  
  // Si la experiencia ha empezado, no dibujamos el humo
  if (!ini) {
    dibHumo();
  }

  // Si aún no se ha iniciado, mostramos el texto de inicio
  if (!ini) {
    dibInicio();
    dibConfs();
    dibConfetiTop();
    return;
  }

  // Si hay un error con el detector facial, mostramos el mensaje 
  // y seguimos dibujando el fondo
  if (window.faceLandmarkerError) {
    setEstadoUI("Error cargando el detector facial");
    dibPart();
    dibConfs();
    dibConfetiTop();
    return;
  }

  // Si el detector facial aún no está listo, mostramos un mensaje
  if (!window.faceLandmarkerReady) {
    setEstadoUI("Cargando detector facial...");
    dibPart();
    dibConfs();
    dibConfetiTop();
    return;
  }

  // Si la cámara todavía no está lista, mostramos un mensaje
  if (!camOK()) {
    setEstadoUI("Esperando la cámara...");
    dibPart();
    dibConfs();
    dibConfetiTop();
    return;
  }

  // Ajustamos el tamaño y la posición del vídeo en pantalla
  actMarcoCam();

  // Guarda el tiempo actual (en milisegundos)
  let ahora = performance.now();

  // Actualizamos la detección facial si ha pasado el tiempo necesario
  // o si todavía no se ha detectado nada
  if (ahora - tiempoUltimaDeteccion >= DETECTION_INTERVAL || resultadoDeteccion === null) {
    resultadoDeteccion = window.faceLandmarker.detectForVideo(cam.elt, ahora);
    tiempoUltimaDeteccion = ahora;
    datosFrame = null;
  }

  let res = resultadoDeteccion;

  // Si se ha detectado al menos una cara, usamos sus landmarks
  if (res && res.faceLandmarks && res.faceLandmarks.length > 0) {
    ultimaCaraDetectada = millis();

    let puntosCara = res.faceLandmarks[0];

    // Si aún no tenemos datos de este frame, los calculamos
    if (!datosFrame || datosFrame.puntosRef !== puntosCara) {
      datosFrame = obtenerDatosFrame(res, puntosCara);
    }

    ultimoDatosValidos = datosFrame;

    // Guardamos el valor de apertura de la boca
    boca = datosFrame.boca;

    // Actualizamos el estado del reto
    actBoca();

    // Dibujamos el estado visual sobre la boca
    dibEstado(datosFrame);

    // Si la boca está abierta y el reto no ha terminado,
    // activamos los efectos de cepillado
    if (estado === "abierta" && !finReto) {
      let centroX = datosFrame.centro.x;
      let centroY = datosFrame.centro.y;
      let anchoBoca = datosFrame.ancho;

      crearPart(centroX, centroY, anchoBoca);
      dibCepillo(centroX, centroY, anchoBoca);
      dibEspuma(centroX, centroY, anchoBoca);
      dibBrillos(centroX, centroY, anchoBoca);
    }
  } else {
    // Si no se detecta ninguna cara, reiniciamos el estado de la boca
    let haceCuanto = millis() - ultimaCaraDetectada;

    if (haceCuanto <= TIEMPO_TOLERANCIA  && ultimoDatosValidos) {
      dibEstado(ultimoDatosValidos);

      if (estado === "abierta" && !finReto) {
        let centroX = ultimoDatosValidos.centro.x;
        let centroY = ultimoDatosValidos.centro.y;
        let anchoBoca = ultimoDatosValidos.ancho;

        dibCepillo(centroX, centroY, anchoBoca);
        dibEspuma(centroX, centroY, anchoBoca);
        dibBrillos(centroX, centroY, anchoBoca);
      }
    } else {
      boca = 0;
      abierta = false;
      tBoca = 0;
      estado = "cerrada";
      setEstadoUI("No se detecta una cara");
    }
  }

  // Dibujamos los efectos que van por encima de todo
  dibPart();
  dibConfs();
  dibConfetiTop();
}

// =====================================
// AJUSTE DEL VÍDEO
// =====================================

// Ajustamos tamaño y posición del vídeo para que ocupe la pantalla
// manteniendo proporción y centrado
function actMarcoCam() {
  // Tamaño original del vídeo de la cámara
  let wOriginal = cam.elt.videoWidth;
  let hOriginal = cam.elt.videoHeight;

  // Escala para que el vídeo cubra toda la pantalla
  let esc = max(width / wOriginal, height / hOriginal);

  // Tamaño del vídeo escalado
  wVideo = wOriginal * esc;
  hVideo = hOriginal * esc;

  // Posición para centrar el vídeo en pantalla
  posVideoX = (width - wVideo) / 2;
  posVideoY = (height - hVideo) / 2;
}

// =====================================
// FONDO
// =====================================

// Dibuja el fondo general con luna y murciélagos
function dibFondo() {
  noStroke();

  if (!ini || !camOK()) {
    fill(15, 0, 24);
  } else {
    fill(20, 0, 30, 45);
  }

  rect(0, 0, width, height);

  dibLuna();
  dibMurcis();
}

// Dibuja la luna de fondo con un sombrero de bruja
function dibLuna() {
  push();
  translate(width - 170, 120);

  // Luna
  noStroke();
  fill(255, 244, 190, 210);
  ellipse(0, 0, 110, 110);

  // Sombrero de bruja
  fill(20, 10, 25, 245);
  noStroke();

  // Ala del sombrero
  ellipse(0, 12, 80, 16);

  // Copa del sombrero
  beginShape();
  vertex(-16, 12);
  vertex(-8, -12);
  vertex(0, -42);   // punta 
  vertex(10, -10);
  vertex(18, 12);
  endShape(CLOSE);

  pop();
}

// Dibuja los murciélagos
function dibMurcis() {
  for (let i = 0; i < murcis.length; i++) {
    murcis[i].act();
    murcis[i].dib();
  }
}

// Dibuja el mensaje inicial cuando la experiencia aún no ha empezado
function dibInicio() {
  fill(255);
  textAlign(CENTER, CENTER);

  textFont(fuenteTitulo);
  textSize(36);
  text("Pulsa “Empezar experiencia”", width / 2, height / 2);

  textFont(fuenteTexto);
  textSize(18);
  fill(245);
  text("Abre la boca y aguanta 60 segundos para un cepillado de miedo", width / 2, height / 2 + 38);
}

// =====================================
// HUMO
// Dibuja una capa de humo en la parte inferior de la pantalla.
// El efecto se crea usando ruido (noise).
// =====================================

function dibHumo() {
  push();
  noStroke();

  // Altura inicial donde empieza el humo (parte inferior de la pantalla)
  let inicioHumoY = height * 0.64;

  // Altura total del área donde se dibuja el humo
  let alturaHumo = height * 0.28;

  // Tiempo para animar el ruido y dar sensación de movimiento
  let tiempoAnimacion = frameCount * 0.0035;

  // Recorre las filas de humo en vertical
  for (let y = 0; y < alturaHumo; y += 22) {
    // La opacidad disminuye hacia arriba para que el humo se desvanezca
    let opacidadBase = map(y, 0, alturaHumo, 16, 3);

    // Recorre las columnas de humo en horizontal
    for (let x = 0; x < width; x += 32) {
      // Genera un valor de ruido para decidir si dibujar humo
      let valorRuido = noise(x * 0.0035, y * 0.018, tiempoAnimacion);

      // Solo dibuja humo en ciertas zonas para crear formas irregulares
      if (valorRuido > 0.5) {

        // Ajustamos la opacidad según el ruido
        let opacidad = map(valorRuido, 0.5, 1, 0, opacidadBase);

        // Variaciones en la posición para que el humo se mueva
        let posX = x + map(noise(x * 0.006, y * 0.01, tiempoAnimacion + 20), 0, 1, -10, 10);
        let posY = inicioHumoY + y + map(noise(x * 0.006, y * 0.01, tiempoAnimacion + 40), 0, 1, -6, 6);

        // Tamaño de cada nube de humo según el ruido
        let ancho = map(valorRuido, 0.5, 1, 42, 86);
        let alto = map(valorRuido, 0.5, 1, 18, 34);

        // Dibujamos la forma del humo (elipse suave)
        fill(220, 220, 235, opacidad);
        ellipse(posX, posY, ancho, alto);
      }
    }
  }

  pop();
}

// =====================================
// DATOS DE LA BOCA
// =====================================

// A partir de los puntos detectados de la cara,
// obtenemos los puntos clave de la boca y calculamos
// su posición, tamaño y apertura
function obtenerDatosFrame(res, puntosCara) {
  // Puntos concretos de la boca (índices del detector facial)
  let p13 = puntoPantalla(puntosCara[13]); // Labio superior
  let p14 = puntoPantalla(puntosCara[14]); // Labio inferior
  let p61 = puntoPantalla(puntosCara[61]); // Lado izquierdo   
  let p291 = puntoPantalla(puntosCara[291]); // Lado derecho
  let p82 = puntoPantalla(puntosCara[82]);  // comisura izquierda
  let p312 = puntoPantalla(puntosCara[312]); // comisura derecha

  return {
    // Guardamos los puntos originales para saber si cambian en el siguiente frame
    puntosRef: puntosCara,
    // Puntos de la cara completos
    puntosCara: puntosCara,
    // Puntos principales de la boca
    labioSup: p13,
    labioInf: p14,
    izq: p61,
    der: p291,
    // Puntos auxiliares para colocar los colmillos
    anclaIzq: p82,
    anclaDer: p312,
    // Centro aproximado de la boca
    centro: {
      x: (p13.x + p14.x + p61.x + p291.x) / 4,
      y: (p13.y + p14.y + p61.y + p291.y) / 4
    },
    // Anchura de la boca
    ancho: dist(p61.x, p61.y, p291.x, p291.y),
    // Apertura de la boca
    boca: valBoca(res, puntosCara)
  };
}

// =====================================
// DETECCIÓN DE BOCA
// =====================================

// Calcula cuánto está abierta la boca.
// Primero usa los datos del detector (si existen)
// Si no, lo calcula usando la posición de los puntos
function valBoca(res, puntosCara) {
  // Si el detector devuelve información sobre la expresión de la cara
  if (res.faceBlendshapes && res.faceBlendshapes.length > 0) {
    // Obtenemos las expresiones de la cara (abrir boca, cerrar boca, etc.)
    let expresionCara = res.faceBlendshapes[0].categories || [];
    // Obtenemos cuánto se está abriendo la mandíbula
    let aperturaMandibula = valorCat(expresionCara, "jawOpen");
    // Obtenemos cuánto se está abriendo la boca
    let aperturaBoca = valorCat(expresionCara, "mouthOpen");

    // Si tenemos datos de apertura de la boca o la mandíbula
    if (aperturaMandibula !== null || aperturaBoca !== null) {
      let valorAperturaMandibula = 0;
      if (aperturaMandibula !== null) {
        valorAperturaMandibula = aperturaMandibula;
      }
      let valorAperturaBoca = 0;
      if (aperturaBoca !== null) {
        valorAperturaBoca = aperturaBoca;
      }

      // Nos quedamos con el valor más alto de los dos
      return max(valorAperturaMandibula, valorAperturaBoca);
    }
  }

  // Definimos los puntos de la cara que vamos a usar
  let labioSup = puntosCara[13];
  let labioInf = puntosCara[14];
  let ojoIzq = puntosCara[33];
  let ojoDer = puntosCara[263];

  // Si falta algún punto no podemos calcular nada
  if (!labioSup || !labioInf || !ojoIzq || !ojoDer) return 0;

  // Disntacia entre los labios (cuánto se abre la boca)
  let distLabios = dist(labioSup.x, labioSup.y, labioInf.x, labioInf.y);
  
  // Distancia entre los ojos (tamaño de referencia de la cara)
  let distCara = dist(ojoIzq.x, ojoIzq.y, ojoDer.x, ojoDer.y);

  // Evitamos dividir entre 0 si algo falla.  
  if (distCara === 0) return 0;

  // Devuleve la propoción de apertura de la boca
  return distLabios / distCara;
}

// Busca una expresión concreta por su nombre (por ejemplo "mouthOpen")
function valorCat(expresionCara, nombre) {
  // Recorremos la lista y buscamos la expresión con ese nombre
  let item = expresionCara.find(function (c) {
    return c.categoryName === nombre;
  });
  // Si la encontramos devolvemos su valor
  if (item) return item.score;
  // si no existe devolvemos null
  return null;
}

// Convierte un punto de la cara (de 0 a 1)
// a coordenadas reales de pantalla
function puntoPantalla(pt) {
  return {
    x: posVideoX + (1 - pt.x) * wVideo,
    y: posVideoY + pt.y * hVideo
  };
}

// Devuelve los puntos del contorno exterior de la boca
function bocaExt(puntosCara) {
  // Lista de puntos concretos de la cara que rodean la boca
  // Estos números vienen definidos por el modelo de detección facial (MediaPipe)
  // y corresponden siempre a las mismas posiciones de la cara
  let ids = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181];
  let puntos = [];

  // Recorremos esos puntos y los convertimos a coordenadas de pantalla
  for (let i = 0; i < ids.length; i++) {
    puntos.push(puntoPantalla(puntosCara[ids[i]]));
  }

  return puntos;
}

// Devuelve los puntos del contorno interior de la boca
function bocaInt(puntosCara) {
  let ids = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178];
  let puntos = [];

  for (let i = 0; i < ids.length; i++) {
    puntos.push(puntoPantalla(puntosCara[ids[i]]));
  }

  return puntos;
}

// Dibuja una máscara gráfica semitransparente sobre la zona de la boca
function dibMascaraBoca(puntosCara) {
  let ext = bocaExt(puntosCara);
  let inn = bocaInt(puntosCara);

  push();
  noStroke();

  fill(70, 20, 90, 70);
  beginShape();
  for (let i = 0; i < ext.length; i++) {
    vertex(ext[i].x, ext[i].y);
  }
  endShape(CLOSE);

  fill(30, 10, 40, 85);
  beginShape();
  for (let i = 0; i < inn.length; i++) {
    vertex(inn[i].x, inn[i].y);
  }
  endShape(CLOSE);

  pop();
}

// =====================================
// LÓGICA DEL RETO
// =====================================

// Comprobamos si la boca está abierta o cerrada,
// actualiza el tiempo y comprueba si el reto se ha completado
function actBoca() {
  if (finReto) return;

  let umbral = 0.16;
  let ahora = millis();
  let dt = ahora - tUlt;
  tUlt = ahora;

  if (boca > umbral) {
    estado = "abierta";

    // Si acaba de abrirse, guardamos el instante inicial
    if (!abierta) {
      abierta = true;
      tIni = ahora;
    }

    // Calculamos el tiempo que la boca lleva abierta de forma continua
    tBoca = ahora - tIni;

    // Sumamos el tiempo al progreso total del reto
    tAcum = constrain(tAcum + dt, 0, 60000);

    // Cambiamos el mensaje según el tiempo que la boca lleva abierta
    if (tBoca < 1000) {
      setEstadoUI("\u{1FAA5} Cepillando...");
    } else if (tBoca < 3000) {
      setEstadoUI("\u{2728} ¡Muy bien!");
    } else {
      setEstadoUI("\u{2B50} ¡Sigue así!");
    }

    actProg();

    // Si alcanza un minuto, el reto termina
    if (tAcum >= 60000) {
      completarReto();
    }
  } else {
    // Si la boca se cierra, reiniciamos el intento continuo
    estado = "cerrada";
    abierta = false;
    tBoca = 0;

    setEstadoUI("\u{1F383} Filtro Halloween activado");
    actProg();
  }
}

// Calcula y actualiza el progreso del reto en segundos y porcentaje
function actProg() {
  let seg = floor(tAcum / 1000);
  let porc = constrain((tAcum / 60000) * 100, 0, 100);

  setTiempoUI(seg + " / 60 s");
  setProgresoUI(porc);
}

// Activa el estado final del reto y lanza los efectos de celebración
function completarReto() {
  finReto = true;
  abierta = false;
  estado = "cerrada";

  setEstadoUI("\u{1F3C6} ¡Reto conseguido!");
  setTiempoUI("60 / 60 s");
  setProgresoUI(100);

  if (fin) fin.classList.remove("oculto");

  crearConfs();
  crearConfetiTop();
}

// =====================================
// DIBUJO SOBRE LA BOCA
// =====================================

// Dibuja lo que se ve sobre la boca en cada momento
function dibEstado(datos) {
  if (datos.puntosCara) {
    dibMascaraBoca(datos.puntosCara);
  }

  // Si la boca está cerrada o el reto ha terminado,
  // mostramos el filtro de Halloween (colmillos)
  if (estado === "cerrada" || finReto) {
    dibFiltro(datos);
  }
}

// Dibuja los colmillos del filtro Halloween sobre la boca
function dibFiltro(datos) {
  if (!datos || !datos.puntosCara) return;

  let ladoIzquierdo = datos.izq; // lado izquierdo de la boca
  let ladoDerecho = datos.der; // lado derecho de la boca
  let anclaIzq = datos.anclaIzq; // punto donde se coloca el colmillo izquierdo
  let anclaDer = datos.anclaDer; // punto donde se coloca el colmillo derecho
  let anchoBoca = datos.ancho; // ancho de la boca

  // Dirección horizontal de la boca
  let dirX = ladoDerecho.x - ladoIzquierdo.x;
  let dirY = ladoDerecho.y - ladoIzquierdo.y;

  // Longitud del vector
  let longitud = sqrt(dirX * dirX + dirY * dirY);

  if (longitud < 1) return;

  dirX = dirX / longitud;
  dirY = dirY / longitud;

  // Vector perpendicular para orientar los colmillos hacia abajo
  let perpX = -dirY;
  let perpY = dirX;

  // Ajustamos la dirección para que siempre apunten hacia abajo
  if (perpY < 0) {
    perpX *= -1;
    perpY *= -1;
  }

  // Tamaño y separación de los colmillos según el ancho de la boca
  let base = constrain(anchoBoca * 0.07, 6, 10);
  let alto = constrain(anchoBoca * 0.24, 18, 30);
  let separacion = constrain(anchoBoca * 0.07, 7, 17);
  let ajusteVertical = constrain(anchoBoca * -0.01, -2, -0.5);

  // Posición del colmillo izquierdo
  let colmilloIzquierdo = {
    x: anclaIzq.x - dirX * separacion + perpX * ajusteVertical,
    y: anclaIzq.y - dirY * separacion + perpY * ajusteVertical
  };

  // Posición del colmillo derecho
  let colmilloDerecho = {
    x: anclaDer.x + dirX * separacion + perpX * ajusteVertical,
    y: anclaDer.y + dirY * separacion + perpY * ajusteVertical
  };

  // Dibuja los colmillos
  push();
  noStroke();
  fill(252, 252, 255, 245);

  dibColmillo(colmilloIzquierdo.x, colmilloIzquierdo.y, dirX, dirY, perpX, perpY, base, alto);
  dibColmillo(colmilloDerecho.x, colmilloDerecho.y, dirX, dirY, perpX, perpY, base, alto);

  pop();
}

// Dibuja un colmillo individual a partir de una base y una punta
function dibColmillo(x, y, hx, hy, vx, vy, base, alto) {
  let pIzq = {
    x: x - hx * base,
    y: y - hy * base
  };

  let pDer = {
    x: x + hx * base,
    y: y + hy * base
  };

  let punta = {
    x: x + vx * alto,
    y: y + vy * alto
  };

  triangle(pIzq.x, pIzq.y, pDer.x, pDer.y, punta.x, punta.y);
}

// =====================================
// CEPILLO DE DIENTES
// =====================================

// Dibuja un cepillo que se mueve sobre la boca
// El movimiento se adapta al tiempo real para que vaya fluido
function dibCepillo(x, y, a) {
  push();

  // Escala del cepillo según el tamaño de la boca
  let esc = constrain(a / 88, 1.25, 2.5);

  // Límites del movimiento del cepillo
  let limiteX = constrain(a * 0.24, 18, 34);
  let limiteY = constrain(a * 0.08, 5, 10);
  let limiteGiro = 14;

  // Tiempo entre frames en segundos (para que el movimiento sea estable)
  let dt = min(deltaTime, 35) / 1000;

  // Movimiento horizontal del cepillo
  cepilloX = cepilloX + velCepilloX * dirCepilloX * dt;
  if (cepilloX > limiteX) {
    cepilloX = limiteX;
    dirCepilloX = -1;
  }
  if (cepilloX < -limiteX) {
    cepilloX = -limiteX;
    dirCepilloX = 1;
  }

  // Movimiento vertical del cepillo
  cepilloY = cepilloY + velCepilloY * dirCepilloY * dt;
  if (cepilloY > limiteY) {
    cepilloY = limiteY;
    dirCepilloY = -1;
  }
  if (cepilloY < -limiteY) {
    cepilloY = -limiteY;
    dirCepilloY = 1;
  }

  // Movimiento de rotación del cepillo
  cepilloGiro = cepilloGiro + velCepilloGiro * dirCepilloGiro * dt;
  if (cepilloGiro > limiteGiro) {
    cepilloGiro = limiteGiro;
    dirCepilloGiro = -1;
  }
  if (cepilloGiro < -limiteGiro) {
    cepilloGiro = -limiteGiro;
    dirCepilloGiro = 1;
  }

  // Posición final del cepillo sobre la boca
  let posCepilloX = x - 43 * esc + cepilloX;
  let posCepilloY = y + 15 * esc + cepilloY;

  // Aplicamos posición y rotación
  translate(posCepilloX, posCepilloY);
  rotate(radians(-8 + cepilloGiro));

  // Dibujamos el cepillo
  scale(esc);
  rectMode(CENTER);
  noStroke();

  fill(180, 120, 255, 36);
  ellipse(8, 0, 125, 34);

  fill(255, 90, 150);
  rect(0, 0, 102, 20, 11);

  fill(255, 185, 215);
  rect(-14, 0, 36, 8, 5);

  fill(245);
  rect(45, 0, 26, 24, 5);

  fill(120, 255, 180);
  for (let i = -8; i <= 8; i += 4) {
    rect(54, i * 0.42, 4.5, 11, 2);
  }

  pop();
}

// =====================================
// ESPUMA Y BRILLOS
// =====================================

// Dibuja burbujas (espuma) alrededor de la boca
// Cuanto más tiempo esté abierta la boca, más burbujas aparecen
function dibEspuma(x, y, a) {
  noStroke();

  // Cantidad de burbujas inicial
  let cant = 6;

  // Aumentamos la cantidad según el tiempo que lleve la boca abierta
  if (tBoca > 1000) cant = 8;
  if (tBoca > 2500) cant = 11;
  if (tBoca > 5000) cant = 14;

  // Reducimos elementos si bajan los fps
  let fps = frameRate();
  if (fps < 45) cant = floor(cant * 0.8);
  if (fps < 30) cant = floor(cant * 0.65);

  // Radio horizontal y vertical donde se moverán las burbujas
  let rx = constrain(a * 0.24, 20, 34);
  let ry = constrain(a * 0.18, 12, 22);

  // Dibujamos las burbujas
  for (let i = 0; i < cant; i++) {
    let posX = x + sin(frameCount * 0.05 + i * 1.37) * rx * 0.9;
    let posY = y + cos(frameCount * 0.06 + i * 1.91) * ry * 0.85;
    let tamBurbuja = 8 + ((i * 7) % 9); // tamaño de la burbuja

    //Burbuja principal
    fill(245, 250, 255, 120);
    ellipse(posX, posY, tamBurbuja, tamBurbuja * 0.92);

    // Brillo pequeño dentro de la burbuja
    fill(220, 240, 255, 75);
    ellipse(posX + 2, posY - 2, tamBurbuja * 0.38, tamBurbuja * 0.38);
  }
}

// Dibuja pequeños destellos alrededor de la boca
// Solo aparecen cuando la boca lleva un tiempo abierta
function dibBrillos(x, y, a) {
  if (tBoca < 1800) return;

  let numDestellos = 3;
  if (tBoca > 4000) numDestellos = 5;

  let sep = constrain(a * 0.34, 18, 34);

  // Dibujamos los destellos
  for (let i = 0; i < numDestellos; i++) {
    let posX = x + sin(frameCount * 0.04 + i) * (sep + i * 5);
    let posY = y + cos(frameCount * 0.05 + i) * (8 + i * 5) - 4;

    push();
    translate(posX, posY);
    rotate(frameCount * 0.03 + i);
    
    // Dibujamos una cruz como brillo
    stroke(255, 255, 255, 170);
    strokeWeight(1.5);
    line(-4, 0, 4, 0);
    line(0, -4, 0, 4);
    pop();
  }
}

// =====================================
// PARTÍCULAS Y CONFETI
// =====================================

// Crea partículas alrededor de la boca cuando está abierta
// Son pequeños elementos visuales (burbujas, chispas, etc.)
// que hacen el efecto de cepillado más dinámico
function crearPart(x, y, a) {
  if (!abierta) return;

  // Si ya hay demasiadas partículas, no añadimos más
  if (parts.length >= MAX_PARTS) return;

  // Cantidad inicial de partículas a crear
  let cantidad = 5;
  // Aumentamos la cantidad según el tiempo con la boca abierta
  if (tBoca > 1000) cantidad = 7;
  if (tBoca > 2500) cantidad = 9;
  if (tBoca > 5000) cantidad = 11;

  // Si el rendimiento baja (menos FPS), reducimos partículas
  let fps = frameRate();
  if (fps < 45) cantidad = floor(cantidad * 0.75);
  if (fps < 30) cantidad = floor(cantidad * 0.6);

  // Aseguramos un mínimo de partículas
  cantidad = max(4, cantidad);

  // Creamos las partículas y las guardamos en el array
  for (let i = 0; i < cantidad; i++) {
    if (parts.length >= MAX_PARTS) break;
    parts.push(new Part(x, y, a, tBoca));
  }
}

// Dibuja y actualiza todas las partículas activas
function dibPart() {
  // Recorremos las partículas desde el final (para poder eliminar)
  for (let i = parts.length - 1; i >= 0; i--) {
    // Actualizamos su movimiento
    parts[i].act();
    // Actualizamos la partícula
    parts[i].dib();
    // Eliminamos la partícula
    if (parts[i].muerta()) {
      parts.splice(i, 1);
    }
  }
}

// Crea el confeti de celebración final
function crearConfs() {
  confs = [];
  for (let i = 0; i < MAX_CONFS; i++) {
    confs.push(new Confeti());
  }
}

// Recorre y dibuja el confeti final
function dibConfs() {
  for (let i = confs.length - 1; i >= 0; i--) {
    confs[i].act();
    confs[i].dib();
  }
}

// =====================================
// PARTÍCULAS
// =====================================

// Esta clase crea una partícula decorativa que aparece en la zona de la boca
class Part {
  constructor(x, y, a, t) {
    // Posición inicial con una pequeña variación para que no salgan todas del mismo punto
    this.x = x + random(-a * 0.22, a * 0.22);
    this.y = y + random(-a * 0.18, a * 0.12);

    // Velocidad inicial de la partícula
    this.vx = random(-1.2, 1.2);
    this.vy = random(-2.2, -0.6);

    // Tamaño de la partícula
    this.tam = random(6, 14);
    // Tiempo de vida de la partícula
    this.vida = 190;
    // Rotación inicial y velocidad de giro
    this.rot = random(TWO_PI);
    this.vr = random(-0.05, 0.05);

    // El tipo de partícula depende del tiempo que lleva la boca abierta
    if (t > 5000) {
      this.tipo = random(["esp", "chis", "cal", "mur", "bur"]);
    } else if (t > 2500) {
      this.tipo = random(["esp", "chis", "cal", "bur"]);
    } else if (t > 1000) {
      this.tipo = random(["esp", "chis", "bur"]);
    } else {
      this.tipo = random(["esp", "bur"]);
    }
  }

  // Actualiza el movimiento, el giro y la vida de la partícula
  act() {
    this.x += this.vx;
    this.y += this.vy;
    this.rot += this.vr;
    this.vida -= 3.4;
    // Hace que poco a poco la partícula caiga o pierda fuerza al subir
    this.vy += 0.01;
  }

  // Dibuja la partícula según el tipo que le haya tocado
  dib() {
    push();
    translate(this.x, this.y);
    rotate(this.rot);
    noStroke();

    // Burbuja
    if (this.tipo === "bur") {
      fill(210, 235, 255, this.vida * 0.85);
      ellipse(0, 0, this.tam, this.tam);
      // Brillo de la burbuja
      fill(255, 255, 255, this.vida * 0.35);
      ellipse(-this.tam * 0.15, -this.tam * 0.15, this.tam * 0.35, this.tam * 0.35);
    }

    // Espuma
    if (this.tipo === "esp") {
      fill(245, 250, 255, this.vida);
      ellipse(0, 0, this.tam, this.tam * 0.9);
      // Detalles brillantes
      fill(220, 240, 255, this.vida * 0.45);
      ellipse(2, -2, this.tam * 0.34, this.tam * 0.34);
    }

    // Chispa
    if (this.tipo === "chis") {
      fill(255, 205, 130, this.vida);
      rectMode(CENTER);
      rect(0, 0, this.tam * 0.65, this.tam * 0.65, 2);
    }

    // Calabaza
    if (this.tipo === "cal") {
      fill(255, 140, 0, this.vida);
      ellipse(0, 0, this.tam * 1.05, this.tam);

      // ojos
      fill(35, 15, 15, this.vida);
      triangle(-this.tam * 0.16, -this.tam * 0.05, -this.tam * 0.03, this.tam * 0.08, -this.tam * 0.28, this.tam * 0.08);
      triangle(this.tam * 0.16, -this.tam * 0.05, this.tam * 0.03, this.tam * 0.08, this.tam * 0.28, this.tam * 0.08);

      // boca
      rectMode(CENTER);
      rect(0, this.tam * 0.22, this.tam * 0.28, this.tam * 0.08, 2);
    }

    // Murciélago
    if (this.tipo === "mur") {
      fill(25, 25, 35, this.vida);
      beginShape();
      vertex(-this.tam * 0.7, 0);
      vertex(-this.tam * 0.2, -this.tam * 0.28);
      vertex(0, 0);
      vertex(this.tam * 0.2, -this.tam * 0.28);
      vertex(this.tam * 0.7, 0);
      vertex(0, this.tam * 0.18);
      endShape(CLOSE);
    }

    pop();
  }

  // Devuelve true cuando la partícula ya no tiene vida
  muerta() {
    return this.vida <= 0;
  }
}

// =====================================
// MURCIÉLAGOS
// =====================================

// Esta clase crea un murciélago que se mueve por el fondo
class Murci {
  constructor(x, y, v) {
    // Posición inicial
    this.posX = x;
    this.posY = y;
    // Velocidad horizontal (se mueve de izquierda a derecha)
    this.v = v;
    // Fase para animar el movimiento (aleteo)
    this.faseAleteo = random(TWO_PI);
    // Escala para que no todos los murciélagos sean iguales
    this.esc = random(0.7, 1.3);
    // Tipo aleatorio: murciélago o fantasma
    this.tipo = random(["mur", "fan"]);
  }

  // Actualiza la posición y el movimiento de las alas
  act() {
    this.posX += this.v; // se mueve hacia la derecha
    this.faseAleteo += 0.22; // cambia la fase del aleteo

    // Si sale por la derecha de la pantalla, vuelve a empezar por la izquierda
    if (this.posX > width + 40) {
      this.posX = -40;
      this.posY = random(40, height * 0.4);
    }
  }

  dib() {
    push();
    translate(this.posX, this.posY);
    scale(this.esc);
    noStroke();

    // Movimiento suave
    let mov = sin(this.faseAleteo) * 8;

    // =========================
    // MURCIÉLAGO
    // =========================
    if (this.tipo === "mur") {
      fill(32, 32, 46, 205);

      // alas
      triangle(-18, 0, -5, -11 - mov, -2, 0);
      triangle(18, 0, 5, -11 - mov, 2, 0);

      // cuerpo
      ellipse(0, 0, 11, 8.5);
    }

    // =========================
    // FANTASMA
    // =========================
    if (this.tipo === "fan") {
      let flot = sin(this.faseAleteo * 0.6) * 4;

      fill(220, 220, 245, 165);

      // Cabeza
      ellipse(0, -8 + flot, 12, 12);

      // Cuerpo principal
      beginShape();
      vertex(-6, -2 + flot);
      vertex(6, -2 + flot);
      vertex(6, 9 + flot);
      vertex(3.5, 7 + flot);
      vertex(1.5, 10 + flot);
      vertex(0, 7 + flot);
      vertex(-1.5, 10 + flot);
      vertex(-3.5, 7 + flot);
      vertex(-6, 9 + flot);
      endShape(CLOSE);

      // Ojos
      fill(55, 55, 75, 120);
      ellipse(-2.2, -8 + flot, 1.6, 2.2);
      ellipse(2.2, -8 + flot, 1.6, 2.2);
    }

    pop();
  }
}

// =====================================
// CONFETI FINAL
// =====================================

// Esta clase crea las partículas de confeti que caen cuando se completa el reto
class Confeti {
  constructor() {
    // Inicializa el confeti con valores aleatorios
    this.reset();
    // Hace que algunas piezas empiecen más arriba (fuera de pantalla)
    this.y = random(-height, 0);
  }

  // Reinicia el confeti con nuevas posiciones y propiedades (aleatorios)
  reset() {
    this.x = random(width);  
    this.y = random(-80, -10);  
    this.vx = random(-1.2, 1.2); 
    this.vy = random(2.5, 6);
    this.s = random(10, 20);
    this.r = random(TWO_PI);
    this.vr = random(-0.08, 0.08);
    this.tipo = random(["cal", "mur", "fant", "car"]);
  }

  // Actualiza la posición y el giro del confeti
  act() {
    this.x += this.vx;
    this.y += this.vy;
    this.r += this.vr;

    // Si sale por abajo de la pantalla, se reinicia arriba
    if (this.y > height + 30) {
      this.reset();
    }
  }

  // Dibuja el confeti según su tipo
  dib() {
    push();
    translate(this.x, this.y);
    rotate(this.r);
    noStroke();

    // Calabaza
    if (this.tipo === "cal") {
      fill(255, 140, 0, 220);
      ellipse(0, 0, this.s, this.s);

      fill(40, 10, 10, 220);
      triangle(-this.s * 0.18, -this.s * 0.1, -this.s * 0.04, this.s * 0.08, -this.s * 0.32, this.s * 0.08);
      triangle(this.s * 0.18, -this.s * 0.1, this.s * 0.04, this.s * 0.08, this.s * 0.32, this.s * 0.08);

      rectMode(CENTER);
      rect(0, this.s * 0.22, this.s * 0.34, this.s * 0.1, 3);
    }

    // Murciélagos
    if (this.tipo === "mur") {
      fill(20, 20, 28, 220);
      triangle(-this.s * 0.8, 0, -this.s * 0.2, -this.s * 0.45, 0, 0);
      triangle(this.s * 0.8, 0, this.s * 0.2, -this.s * 0.45, 0, 0);
      ellipse(0, 0, this.s * 0.4, this.s * 0.35);
    }

    // Fantasmas
    if (this.tipo === "fant") {
      fill(220, 220, 255, 220);
      ellipse(0, -this.s * 0.1, this.s * 0.7, this.s * 0.8);
      rectMode(CENTER);
      rect(0, this.s * 0.24, this.s * 0.6, this.s * 0.7, 4);
    }

    // Cuadrado simple
    if (this.tipo === "car") {
      fill(140, 255, 140, 220);
      rectMode(CENTER);
      rect(0, 0, this.s, this.s, 4);
    }

    pop();
  }
}

// =====================================
// CONFETI SUPERIOR
// =====================================

// Ajusta el tamaño del canvas para que ocupe toda la pantalla
function ajustarConfetiTop() {
  if (!confCanvas) return;
  confCanvas.width = window.innerWidth;
  confCanvas.height = window.innerHeight;
}

// Crea las piezas de confeti superior
function crearConfetiTop() {
  // Reinicia el array de confeti
  confTop = [];

  // Genera varias piezas según el máximo definido
  for (let i = 0; i < MAX_CONFTOP; i++) {
    confTop.push(new ConfetiTop());
  }
}

// Borra completamente el canvas del confeti
function limpiarConfetiTop() {
  if (!confCtx || !confCanvas) return;
  // Limpia toda la pantalla
  confCtx.clearRect(0, 0, confCanvas.width, confCanvas.height);
}

// Actualiza y dibuja el confeti superior
function dibConfetiTop() {
  if (!confCtx || !confCanvas) return;

  // Limpia antes de volver a dibujar
  confCtx.clearRect(0, 0, confCanvas.width, confCanvas.height);

  // Recorre todas las piezas de confeti (de atrás hacia delante)
  for (let i = confTop.length - 1; i >= 0; i--) {
    
    // Actualiza movimiento
    confTop[i].act();

    // Dibuja la pieza
    confTop[i].dib(confCtx);

    // Si la pieza ya ha terminado su vida, la elimina
    if (confTop[i].muerto()) {
      confTop.splice(i, 1);
    }
  }
}

// Clase que crea cada pieza de confeti que se dibuja en el canvas superior
class ConfetiTop {
  constructor() {
    // Posición inicial aleatoria en la parte superior de la pantalla
    this.x = random(window.innerWidth);
    this.y = random(-window.innerHeight, -20);
    // Velocidad de movimiento horizontal y vertical
    this.vx = random(-1.5, 1.5);
    this.vy = random(2.5, 6);
    // Tamaño de la pieza de confeti
    this.tam = random(8, 16);
    // Rotación inicial y velocidad de giro
    this.r = random(TWO_PI);
    this.vr = random(-0.08, 0.08);
    // Nivel de opacidad (empieza completamente visible)
    this.opacidad = 1;
    // Tipo de figura que tendrá la pieza
    this.tipo = random(["cir", "cal", "mur", "fan"]);
    this.col = random([
      [255, 140, 0],
      [180, 120, 255],
      [140, 255, 140],
      [255, 255, 255]
    ]);
  }

  // Actualiza la posición, el giro y hace que se vaya desvaneciendo al bajar
  act() {
    this.x += this.vx;
    this.y += this.vy;
    this.r += this.vr;

    // Cuando la pieza baja bastante, empieza a desaparecer poco a poco
    if (this.y > window.innerHeight * 0.72) {
      this.opacidad -= 0.02;
    }
  }

  // Dibuja la pieza de confeti usando el contexto 2D del canvas superior
  dib(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.r);
    ctx.globalAlpha = max(0, this.opacidad);

    // Círculo simple de color
    if (this.tipo === "cir") {
      ctx.fillStyle = "rgb(" + this.col[0] + ", " + this.col[1] + ", " + this.col[2] + ")";
      ctx.beginPath();
      ctx.arc(0, 0, this.tam * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    // Calabaza
    if (this.tipo === "cal") {
      ctx.fillStyle = "rgb(255,140,0)";
      ctx.beginPath();
      ctx.arc(0, 0, this.tam * 0.55, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgb(30,10,10)";
      ctx.beginPath();
      ctx.moveTo(-this.tam * 0.18, -this.tam * 0.05);
      ctx.lineTo(-this.tam * 0.05, this.tam * 0.08);
      ctx.lineTo(-this.tam * 0.28, this.tam * 0.08);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(this.tam * 0.18, -this.tam * 0.05);
      ctx.lineTo(this.tam * 0.05, this.tam * 0.08);
      ctx.lineTo(this.tam * 0.28, this.tam * 0.08);
      ctx.fill();
    }

    // Murciélago
    if (this.tipo === "mur") {
      ctx.fillStyle = "rgb(25,25,35)";
      ctx.beginPath();
      ctx.moveTo(-this.tam * 0.75, 0);
      ctx.lineTo(-this.tam * 0.2, -this.tam * 0.35);
      ctx.lineTo(0, 0);
      ctx.lineTo(this.tam * 0.2, -this.tam * 0.35);
      ctx.lineTo(this.tam * 0.75, 0);
      ctx.lineTo(0, this.tam * 0.18);
      ctx.closePath();
      ctx.fill();
    }

    // Fantasma
    if (this.tipo === "fan") {
      ctx.fillStyle = "rgb(235,235,255)";
      ctx.beginPath();
      ctx.arc(0, -this.tam * 0.08, this.tam * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-this.tam * 0.22, 0, this.tam * 0.44, this.tam * 0.42);
    }

    ctx.restore();
  }

  // Devuelve true cuando la pieza ya no se ve
  muerto() {
    return this.opacidad <= 0;
  }
}

// =====================================
// RESIZE
// =====================================

// Se ejecuta cuando cambia el tamaño de la ventana
function windowResized() {
  // Ajusta el canvas principal al nuevo tamaño
  resizeCanvas(windowWidth, windowHeight);
  // Ajusta el canvas del confeti superior
  ajustarConfetiTop();
}