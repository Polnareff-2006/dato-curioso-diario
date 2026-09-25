// 1. Obtener qué número de día del año es hoy (del 1 al 365)
function obtenerDiaDelAno() {
  const hoy = new Date();
  const inicioDeAno = new Date(hoy.getFullYear(), 0, 1);
  const diferenciaMs = hoy - inicioDeAno;
  const msPorDia = 1000 * 60 * 60 * 24;
  return Math.floor(diferenciaMs / msPorDia) + 1;
}

// 2. Función para renderizar un dato específico en la pantalla
function mostrarDatoEnPantalla(dato) {
  const tarjeta = document.getElementById('tarjeta-dato');
  
  // Asignar el tema por categoría (cambia los colores dinámicos)
  tarjeta.className = dato.tema;

  // Inyectar datos
  document.querySelector('.etiqueta-categoria').textContent = dato.etiqueta;
  document.getElementById('numero-dato').textContent = `DATO #${dato.dia}:`;
  document.getElementById('titulo-dato').textContent = dato.titulo;
  document.getElementById('imagen-dato').src = dato.imagen;
  document.getElementById('resumen-dato').textContent = dato.resumen;
  document.getElementById('extension-dato').textContent = dato.extension;

  // Actualizar las fuentes citadas
  const listaFuentes = document.querySelector('.fuentes ul');
  listaFuentes.innerHTML = '';
  dato.fuentes.forEach(fuente => {
    const li = document.createElement('li');
    li.textContent = fuente;
    listaFuentes.appendChild(li);
  });
}

// 3. Crear el carrusel de botones con días anteriores
function generarHistorial(datos, diaActual) {
  const contenedor = document.getElementById('grid-historial');
  contenedor.innerHTML = '';

  // Filtramos solo los días anteriores o iguales al día actual
  const datosPasados = datos.filter(item => item.dia <= diaActual);

  datosPasados.forEach(dato => {
    const boton = document.createElement('button');
    boton.className = 'btn-dia-historial';
    boton.textContent = `DÍA ${dato.dia}`;
    
    // Al hacer clic, cargamos ese dato en el monitor central
    boton.addEventListener('click', () => {
      mostrarDatoEnPantalla(dato);
    });

    contenedor.appendChild(boton);
  });
}

// 4. Cargar archivo JSON y arrancar la página
async function iniciarWeb() {
  try {
    const respuesta = await fetch('datos.json');
    const datos = await respuesta.json();

    // Calculamos el día de hoy (puedes poner 3 temporalmente si quieres probar todos los botones)
    const diaHoy = obtenerDiaDelAno();

    // Buscamos el dato de hoy o tomamos el primero por seguridad
    const datoDeHoy = datos.find(item => item.dia === diaHoy) || datos[0];

    // Pintamos la tarjeta principal
    mostrarDatoEnPantalla(datoDeHoy);

    // Generamos los botones del historial
    generarHistorial(datos, diaHoy);

  } catch (error) {
    console.error('Error al cargar los datos:', error);
  }
}

// Iniciar aplicación
iniciarWeb();