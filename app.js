// --- CONFIGURACIÓN DE FECHA ---
// Déjalo en null para usar la fecha real de hoy. 
// O pon un número (ej: 285) para simular cualquier día y probar todos los meses:
const DIA_PRUEBA = null;

const MESES = [
  { nombre: "ENE", inicio: 1, fin: 31 },
  { nombre: "FEB", inicio: 32, fin: 59 },
  { nombre: "MAR", inicio: 60, fin: 90 },
  { nombre: "ABR", inicio: 91, fin: 120 },
  { nombre: "MAY", inicio: 121, fin: 151 },
  { nombre: "JUN", inicio: 152, fin: 181 },
  { nombre: "JUL", inicio: 182, fin: 212 },
  { nombre: "AGO", inicio: 213, fin: 243 },
  { nombre: "SEP", inicio: 244, fin: 273 },
  { nombre: "OCT", inicio: 274, fin: 304 },
  { nombre: "NOV", inicio: 305, fin: 334 },
  { nombre: "DIC", inicio: 335, fin: 365 }
];

let baseDeDatos = [];
let datoActivo = null;
let mesSeleccionadoIndex = -1;

function obtenerDiaDelAno() {
  if (DIA_PRUEBA !== null) return DIA_PRUEBA;
  const hoy = new Date();
  const inicioDeAno = new Date(hoy.getFullYear(), 0, 1);
  return Math.floor((hoy - inicioDeAno) / (1000 * 60 * 60 * 24)) + 1;
}

function obtenerFavoritos() {
  return JSON.parse(localStorage.getItem('favoritos_datos') || '[]');
}

function alternarFavorito(dia) {
  let favs = obtenerFavoritos();
  if (favs.includes(dia)) {
    favs = favs.filter(d => d !== dia);
  } else {
    favs.push(dia);
  }
  localStorage.setItem('favoritos_datos', JSON.stringify(favs));
  actualizarBotonFavorito(dia);

  // Refrescar calendario conservando el día actual activo
  const diaHoy = obtenerDiaDelAno();
  generarCalendarioPorMeses(baseDeDatos, diaHoy, mesSeleccionadoIndex);
}

function actualizarBotonFavorito(dia) {
  const btn = document.getElementById('btn-favorito');
  const favs = obtenerFavoritos();
  if (favs.includes(dia)) {
    btn.textContent = '★';
    btn.classList.add('activo');
  } else {
    btn.textContent = '☆';
    btn.classList.remove('activo');
  }
}

function mostrarDatoEnPantalla(dato) {
  if (!dato) return;
  datoActivo = dato;
  const tarjeta = document.getElementById('tarjeta-dato');
  tarjeta.className = dato.tema;

  document.querySelector('.etiqueta-categoria').textContent = dato.etiqueta;
  document.getElementById('numero-dato').textContent = `DATO #${dato.dia}:`;
  document.getElementById('titulo-dato').textContent = dato.titulo;
  document.getElementById('imagen-dato').src = dato.imagen;
  document.getElementById('resumen-dato').textContent = dato.resumen;
  document.getElementById('extension-dato').textContent = dato.extension;

  const listaFuentes = document.querySelector('.fuentes ul');
  listaFuentes.innerHTML = '';
  dato.fuentes.forEach(fuente => {
    const li = document.createElement('li');
    li.textContent = fuente;
    listaFuentes.appendChild(li);
  });

  actualizarBotonFavorito(dato.dia);
}

function obtenerIndiceMesDeDia(dia) {
  return MESES.findIndex(m => dia >= m.inicio && dia <= m.fin);
}

function generarCalendarioPorMeses(datos, diaActual, mesForzado = -1) {
  const barraMeses = document.getElementById('selector-meses');
  const grid = document.getElementById('grid-historial');
  const favoritos = obtenerFavoritos();

  // Encontrar qué meses tienen datos válidos hasta el día actual
  const mesesDisponibles = [];
  MESES.forEach((mes, idx) => {
    const tieneDatos = datos.some(d => d.dia >= mes.inicio && d.dia <= mes.fin && d.dia <= diaActual);
    if (tieneDatos) {
      mesesDisponibles.push(idx);
    }
  });

  // Determinar mes activo
  if (mesForzado !== -1 && mesesDisponibles.includes(mesForzado)) {
    mesSeleccionadoIndex = mesForzado;
  } else {
    const mesDelDia = obtenerIndiceMesDeDia(diaActual);
    mesSeleccionadoIndex = mesesDisponibles.includes(mesDelDia)
      ? mesDelDia
      : (mesesDisponibles[mesesDisponibles.length - 1] ?? -1);
  }

  // 1. Dibujar botones de meses disponibles
  barraMeses.innerHTML = '';
  mesesDisponibles.forEach(idx => {
    const mes = MESES[idx];
    const btnMes = document.createElement('button');
    btnMes.className = `btn-mes ${idx === mesSeleccionadoIndex ? 'activo' : ''}`;
    btnMes.textContent = mes.nombre;
    btnMes.addEventListener('click', () => {
      generarCalendarioPorMeses(datos, diaActual, idx);
    });
    barraMeses.appendChild(btnMes);
  });

  // 2. Dibujar días del mes seleccionado
  grid.innerHTML = '';
  if (mesSeleccionadoIndex === -1) return;

  const mesActualObj = MESES[mesSeleccionadoIndex];
  const datosAMostrar = datos.filter(d =>
    d.dia >= mesActualObj.inicio &&
    d.dia <= mesActualObj.fin &&
    d.dia <= diaActual
  );

  datosAMostrar.forEach(dato => {
    const boton = document.createElement('button');
    boton.className = 'btn-dia-historial';
    if (favoritos.includes(dato.dia)) {
      boton.classList.add('es-favorito');
    }
    boton.textContent = `DÍA ${dato.dia}`;

    boton.addEventListener('click', () => {
      mostrarDatoEnPantalla(dato);
    });

    grid.appendChild(boton);
  });
}

async function iniciarWeb() {
  try {
    const respuesta = await fetch('datos.json');
    baseDeDatos = await respuesta.json();

    const diaHoy = obtenerDiaDelAno();
    const datoDeHoy = baseDeDatos.find(item => item.dia === diaHoy) || baseDeDatos[0];

    document.getElementById('btn-favorito').addEventListener('click', () => {
      if (datoActivo) alternarFavorito(datoActivo.dia);
    });

    mostrarDatoEnPantalla(datoDeHoy);
    generarCalendarioPorMeses(baseDeDatos, diaHoy);

  } catch (error) {
    console.error('Error al inicializar la web:', error);
  }
}

iniciarWeb();

// ==========================================
// --- INTEGRACIÓN PWA (PROGRESSIVE WEB APP) ---
// ==========================================

// 1. Registro del Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registrado correctamente:', registration.scope);
      })
      .catch((error) => {
        console.warn('[PWA] Error al registrar Service Worker:', error);
      });
  });
}

// 2. Control del Prompt de Instalación PWA
let diferirInstalacion = null;
const btnInstalar = document.getElementById('btn-instalar');

window.addEventListener('beforeinstallprompt', (evento) => {
  // Prevenir banner por defecto para usar nuestro botón estilizado CRT
  evento.preventDefault();
  diferirInstalacion = evento;

  if (btnInstalar) {
    btnInstalar.style.display = 'inline-block';
  }
});

if (btnInstalar) {
  btnInstalar.addEventListener('click', async () => {
    if (!diferirInstalacion) return;
    diferirInstalacion.prompt();
    const eleccion = await diferirInstalacion.userChoice;
    console.log('[PWA] Elección de instalación del usuario:', eleccion.outcome);
    diferirInstalacion = null;
    btnInstalar.style.display = 'none';
  });
}

window.addEventListener('appinstalled', () => {
  console.log('[PWA] Aplicación instalada con éxito en el dispositivo.');
  if (btnInstalar) {
    btnInstalar.style.display = 'none';
  }
});

// 3. Indicador de estado de conexión (Online / Offline)
const badgeConexion = document.getElementById('badge-conexion');

function actualizarEstadoConexion() {
  if (!badgeConexion) return;
  if (!navigator.onLine) {
    badgeConexion.classList.remove('offline-oculto');
  } else {
    badgeConexion.classList.add('offline-oculto');
  }
}

window.addEventListener('online', actualizarEstadoConexion);
window.addEventListener('offline', actualizarEstadoConexion);
actualizarEstadoConexion();

// ==========================================
// --- SISTEMA DE NOTIFICACIONES LOCALES ---
// ==========================================

function actualizarBotonNotif() {
  const btnNotif = document.getElementById('btn-notificaciones');
  if (!btnNotif) return;

  if (!('Notification' in window)) {
    btnNotif.textContent = '[ 🔔 NO SOPORTADO ]';
    btnNotif.disabled = true;
    return;
  }

  if (Notification.permission === 'granted') {
    btnNotif.textContent = '[ 🔔 AVISOS: ON ]';
    btnNotif.classList.add('activo');
    btnNotif.title = 'Avisos activados. Haz clic para probar un aviso';
  } else if (Notification.permission === 'denied') {
    btnNotif.textContent = '[ 🔕 AVISOS: OFF ]';
    btnNotif.classList.remove('activo');
    btnNotif.title = 'Notificaciones bloqueadas en la configuración del navegador';
  } else {
    btnNotif.textContent = '[ 🔔 AVISOS ]';
    btnNotif.classList.remove('activo');
    btnNotif.title = 'Activar notificaciones locales para las curiosidades diarias';
  }
}

async function gestionarPermisoNotificaciones() {
  if (!('Notification' in window)) {
    alert('Tu navegador no tiene soporte para notificaciones locales.');
    return;
  }

  if (Notification.permission === 'granted') {
    lanzarNotificacionLocal();
    return;
  }

  if (Notification.permission !== 'denied') {
    const permiso = await Notification.requestPermission();
    actualizarBotonNotif();
    if (permiso === 'granted') {
      lanzarNotificacionLocal();
    }
  } else {
    alert('Las notificaciones están bloqueadas en tu navegador. Puedes habilitarlas desde los permisos del sitio en la barra de direcciones.');
  }
}

async function lanzarNotificacionLocal(dato = null) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const datoParaMostrar = dato || datoActivo || (baseDeDatos.length ? baseDeDatos[0] : null);
  const titulo = datoParaMostrar ? `Dato #${datoParaMostrar.dia}: ${datoParaMostrar.titulo}` : 'Dato Curioso Diario';
  const opciones = {
    body: datoParaMostrar ? datoParaMostrar.resumen : '¡Descubre el dato curioso del día!',
    icon: 'icons/icon-192.png',
    badge: 'icons/favicon-32.png',
    tag: 'dato-curioso-notificacion',
    renotify: true,
    data: { url: './index.html' }
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(titulo, opciones);
        return;
      }
    }
    new Notification(titulo, opciones);
  } catch (error) {
    console.error('[PWA] Error al emitir la notificación local:', error);
  }
}

const btnNotificaciones = document.getElementById('btn-notificaciones');
if (btnNotificaciones) {
  btnNotificaciones.addEventListener('click', gestionarPermisoNotificaciones);
}
actualizarBotonNotif();

// ==========================================
// --- SINTONIZADOR DE FRECUENCIAS OCULTAS ---
// ==========================================

const LIMITE_DIARIO_FRECUENCIAS = 7;
let listaFrecuencias = [];
let cargandoFrecuenciasPromise = null;
let indiceUltimaFrecuencia = -1;
let audioCtx = null;

/**
 * Obtiene la cantidad de frecuencias sintonizadas en la fecha activa.
 * Se reinicia automáticamente a 0 si el día calculado por obtenerDiaDelAno() cambia.
 */
function obtenerConsumoFrecuencias() {
  const diaHoy = obtenerDiaDelAno();
  try {
    const raw = localStorage.getItem('frecuencias_consumo');
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.dia === diaHoy && typeof data.usos === 'number') {
        return data.usos;
      }
    }
  } catch (e) {
    console.warn('[Sintonizador] Error leyendo frecuencias_consumo:', e);
  }
  return 0;
}

/**
 * Registra un uso de frecuencia para el día actual en localStorage
 */
function registrarUsoFrecuencia() {
  const diaHoy = obtenerDiaDelAno();
  const usosActuales = obtenerConsumoFrecuencias();
  const nuevosUsos = Math.min(LIMITE_DIARIO_FRECUENCIAS, usosActuales + 1);
  localStorage.setItem('frecuencias_consumo', JSON.stringify({
    dia: diaHoy,
    usos: nuevosUsos
  }));
  actualizarEstadoBotonSintonizador();
  return nuevosUsos;
}

/**
 * Actualiza la apariencia y el título del botón sintonizador según el cupo diario
 */
function actualizarEstadoBotonSintonizador() {
  const btn = document.getElementById('btn-sintonizar');
  if (!btn) return;
  const usos = obtenerConsumoFrecuencias();
  const restantes = LIMITE_DIARIO_FRECUENCIAS - usos;

  if (restantes <= 0) {
    btn.textContent = '[ 📡 BUSCANDO SEÑAL... ]';
    btn.classList.add('modo-buscando');
    btn.title = `Límite diario alcanzado (${LIMITE_DIARIO_FRECUENCIAS}/${LIMITE_DIARIO_FRECUENCIAS}). Buscando nuevas frecuencias satélite para mañana...`;
  } else {
    btn.textContent = '[ 📻 SINTONIZAR ]';
    btn.classList.remove('modo-buscando');
    btn.title = `Sintonizar frecuencia aleatoria (${restantes} de ${LIMITE_DIARIO_FRECUENCIAS} disponibles hoy)`;
  }
}

/**
 * Carga frecuencias.json con fetch (al iniciar o al pulsar por primera vez)
 */
async function cargarFrecuencias() {
  if (listaFrecuencias.length > 0) return listaFrecuencias;
  if (!cargandoFrecuenciasPromise) {
    cargandoFrecuenciasPromise = fetch('frecuencias.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((datos) => {
        listaFrecuencias = datos;
        return listaFrecuencias;
      })
      .catch((err) => {
        console.error('Error al cargar frecuencias.json:', err);
        cargandoFrecuenciasPromise = null;
        return [];
      });
  }
  return cargandoFrecuenciasPromise;
}

/**
 * Generador sintético de estática analógica de 0.2 segundos
 * usando la Web Audio API nativa sin dependencias externas
 */
function reproducirEstaticaSintetica() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const duracion = 0.2; // 0.2 segundos
    const sampleRate = audioCtx.sampleRate;
    const totalSamples = Math.floor(sampleRate * duracion);
    const buffer = audioCtx.createBuffer(1, totalSamples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < totalSamples; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    // Filtro analógico pasa-banda para dar textura de sintonización de radio/TV
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 1.0;

    // Control de ganancia suave para un volumen sutil
    const gainNode = audioCtx.createGain();
    const ahora = audioCtx.currentTime;
    gainNode.gain.setValueAtTime(0.08, ahora);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ahora + duracion);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    source.start(ahora);
  } catch (error) {
    console.warn('[Audio] No se pudo reproducir la estática sintetizada:', error);
  }
}

/**
 * Limpia la interfaz del modo frecuencia oculta para restaurar la vista normal
 */
function limpiarEstadoFrecuencia() {
  const contImagen = document.getElementById('contenedor-imagen') || document.querySelector('.pixel-art-caja');
  if (contImagen) contImagen.style.display = '';

  const cajaIcono = document.getElementById('caja-icono-frecuencia');
  if (cajaIcono) {
    cajaIcono.style.display = 'none';
    cajaIcono.classList.remove('buscando');
  }

  const acordeonSaberMas = document.getElementById('acordeon-saber-mas');
  if (acordeonSaberMas) acordeonSaberMas.style.display = '';

  const acordeonFuentes = document.querySelector('.fuentes');
  if (acordeonFuentes) acordeonFuentes.style.display = '';

  const btnFav = document.getElementById('btn-favorito');
  if (btnFav) btnFav.style.display = '';

  const btnVolver = document.getElementById('btn-volver-hoy');
  if (btnVolver) btnVolver.style.display = 'none';

  actualizarEstadoBotonSintonizador();
}

/**
 * Muestra el estado retro de 'Buscando señal...' cuando se alcanza el límite de 7 frecuencias
 */
function mostrarPantallaBuscandoSenal() {
  reproducirEstaticaSintetica();

  const tarjeta = document.getElementById('tarjeta-dato');
  if (tarjeta) {
    tarjeta.classList.remove('crt-estatica');
    void tarjeta.offsetWidth;
    tarjeta.classList.add('crt-estatica');
    setTimeout(() => {
      tarjeta.classList.remove('crt-estatica');
    }, 400);
    tarjeta.className = 'tema-cosmos';
  }

  const etiqueta = document.querySelector('.etiqueta-categoria');
  if (etiqueta) etiqueta.textContent = `📡 FRECUENCIA SATÉLITE [0/7]`;

  const numDato = document.getElementById('numero-dato');
  if (numDato) numDato.textContent = `RADAR SATÉLITE:`;

  const titDato = document.getElementById('titulo-dato');
  if (titDato) {
    titDato.innerHTML = `<span class="texto-parpadeo-lento">BUSCANDO SEÑAL...</span>`;
  }

  const resDato = document.getElementById('resumen-dato');
  if (resDato) {
    resDato.textContent = `Has alcanzado el límite diario de ${LIMITE_DIARIO_FRECUENCIAS} frecuencias satélite. La antena está recalibrando sus sensores orbitales... Nuevas frecuencias disponibles mañana junto al dato del día.`;
  }

  // Ocultar imagen y mostrar radar animado en la caja CRT
  const contImagen = document.getElementById('contenedor-imagen') || document.querySelector('.pixel-art-caja');
  if (contImagen) contImagen.style.display = 'none';

  const cajaIcono = document.getElementById('caja-icono-frecuencia');
  if (cajaIcono) {
    cajaIcono.classList.add('buscando');
    cajaIcono.innerHTML = `<span class="icono-buscando-senal" title="Rastreando órbita...">📡</span>`;
    cajaIcono.style.display = 'flex';
  }

  // Ocultar favoritos y acordeones
  const btnFav = document.getElementById('btn-favorito');
  if (btnFav) btnFav.style.display = 'none';

  const acordeonSaberMas = document.getElementById('acordeon-saber-mas');
  if (acordeonSaberMas) acordeonSaberMas.style.display = 'none';

  const acordeonFuentes = document.querySelector('.fuentes');
  if (acordeonFuentes) acordeonFuentes.style.display = 'none';

  // Mostrar botón de retorno
  const btnVolver = document.getElementById('btn-volver-hoy');
  if (btnVolver) btnVolver.style.display = 'inline-block';

  actualizarEstadoBotonSintonizador();
}

/**
 * Sintoniza una frecuencia satélite oculta de forma aleatoria (máximo 7 por día)
 */
async function sintonizarFrecuencia() {
  const usos = obtenerConsumoFrecuencias();
  if (usos >= LIMITE_DIARIO_FRECUENCIAS) {
    mostrarPantallaBuscandoSenal();
    return;
  }

  // 1. Sonido de estática analógica nativo
  reproducirEstaticaSintetica();

  // 2. Efecto de parpadeo y distorsión CRT durante ~400 ms
  const tarjeta = document.getElementById('tarjeta-dato');
  if (tarjeta) {
    tarjeta.classList.remove('crt-estatica');
    void tarjeta.offsetWidth; // Forzar reflow para reiniciar animación
    tarjeta.classList.add('crt-estatica');
    setTimeout(() => {
      tarjeta.classList.remove('crt-estatica');
    }, 400);
  }

  // 3. Obtener frecuencias
  const frecuencias = await cargarFrecuencias();
  if (!frecuencias || frecuencias.length === 0) {
    console.warn('[Sintonizador] No hay frecuencias disponibles.');
    return;
  }

  // 4. Registrar uso del día e incrementar contador
  const nuevosUsos = registrarUsoFrecuencia();

  // 5. Seleccionar un elemento al azar (evitando repetir el anterior si hay más de 1)
  let indiceAleatorio;
  if (frecuencias.length > 1) {
    do {
      indiceAleatorio = Math.floor(Math.random() * frecuencias.length);
    } while (indiceAleatorio === indiceUltimaFrecuencia);
  } else {
    indiceAleatorio = 0;
  }
  indiceUltimaFrecuencia = indiceAleatorio;
  const frecuencia = frecuencias[indiceAleatorio];

  // 6. Configurar tema visual retro adaptado al tipo
  const temasTipo = {
    comico: 'tema-tecnologia',
    insolito: 'tema-cosmos',
    hazana: 'tema-humanidad',
    anecdota: 'tema-biologia',
    positivo: 'tema-biologia',
    cotidiano: 'tema-tecnologia'
  };
  if (tarjeta) {
    tarjeta.className = temasTipo[frecuencia.tipo] || 'tema-cosmos';
  }

  // 7. Actualizar textos de la pantalla con indicación de uso de hoy
  const etiqueta = document.querySelector('.etiqueta-categoria');
  if (etiqueta) etiqueta.textContent = `📡 FRECUENCIA [${frecuencia.tipo.toUpperCase()}] • ${nuevosUsos}/${LIMITE_DIARIO_FRECUENCIAS}`;

  const numDato = document.getElementById('numero-dato');
  if (numDato) numDato.textContent = `SEÑAL ${frecuencia.id}:`;

  const titDato = document.getElementById('titulo-dato');
  if (titDato) titDato.textContent = frecuencia.titulo;

  const resDato = document.getElementById('resumen-dato');
  if (resDato) resDato.textContent = frecuencia.resumen;

  // 8. Ocultar imagen normal y mostrar caja oscura con emoji fosforescente
  const contImagen = document.getElementById('contenedor-imagen') || document.querySelector('.pixel-art-caja');
  if (contImagen) contImagen.style.display = 'none';

  const cajaIcono = document.getElementById('caja-icono-frecuencia');
  if (cajaIcono) {
    cajaIcono.classList.remove('buscando');
    cajaIcono.innerHTML = `<span class="emoji-frecuencia">${frecuencia.icono}</span>`;
    cajaIcono.style.display = 'flex';
  }

  // 9. Ocultar botón de favoritos y acordeones no aplicables a frecuencias satélite
  const btnFav = document.getElementById('btn-favorito');
  if (btnFav) btnFav.style.display = 'none';

  const acordeonSaberMas = document.getElementById('acordeon-saber-mas');
  if (acordeonSaberMas) acordeonSaberMas.style.display = 'none';

  const acordeonFuentes = document.querySelector('.fuentes');
  if (acordeonFuentes) acordeonFuentes.style.display = 'none';

  // 10. Mostrar botón de retorno al día de hoy
  const btnVolver = document.getElementById('btn-volver-hoy');
  if (btnVolver) btnVolver.style.display = 'inline-block';
}

/**
 * Devuelve el monitor al dato original del día correspondiente en datos.json
 */
function restaurarDiaHoy() {
  reproducirEstaticaSintetica();

  const tarjeta = document.getElementById('tarjeta-dato');
  if (tarjeta) {
    tarjeta.classList.remove('crt-estatica');
    void tarjeta.offsetWidth;
    tarjeta.classList.add('crt-estatica');
    setTimeout(() => {
      tarjeta.classList.remove('crt-estatica');
    }, 400);
  }

  limpiarEstadoFrecuencia();

  const diaHoy = obtenerDiaDelAno();
  const datoDeHoy = baseDeDatos.find((item) => item.dia === diaHoy) || baseDeDatos[0];
  mostrarDatoEnPantalla(datoDeHoy);
}

// Inicialización de escuchadores de eventos para el sintonizador
const btnSintonizar = document.getElementById('btn-sintonizar');
if (btnSintonizar) {
  btnSintonizar.addEventListener('click', sintonizarFrecuencia);
}

const btnVolverHoy = document.getElementById('btn-volver-hoy');
if (btnVolverHoy) {
  btnVolverHoy.addEventListener('click', restaurarDiaHoy);
}

// Si el usuario hace clic en un día del calendario, limpiar estado de frecuencia
const gridHistorial = document.getElementById('grid-historial');
if (gridHistorial) {
  gridHistorial.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('btn-dia-historial')) {
      limpiarEstadoFrecuencia();
    }
  });
}

// Sincronizar estado inicial del botón sintonizador y precarga no bloqueante
actualizarEstadoBotonSintonizador();
cargarFrecuencias();


