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
