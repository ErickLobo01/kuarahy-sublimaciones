/* =====================================================================
   LÓGICA DE LA TIENDA
   ---------------------------------------------------------------------
   Este archivo:
     1. Dibuja los productos (ilustraciones SVG) a partir de PRODUCTOS.
     2. Arma los filtros por categoría.
     3. Arma el enlace de WhatsApp con producto, talle y color elegidos.
     4. Maneja el formulario de pedidos personalizados.
   Los datos están en js/productos.js, que se carga antes que este.
   ===================================================================== */

// ---------- CONFIGURACIÓN ----------
// Número de WhatsApp en formato internacional: 595 (Paraguay) + 981292616
// (se saca el 0 inicial del 0981). Sin espacios, sin "+".
const WHATSAPP = "595981292616";
const NOMBRE_TIENDA = "Kuarahy Estampa";

// Color del contorno de los dibujos
const CONTORNO = "#3b2a20";


/* =====================================================================
   1. UTILIDADES
   ===================================================================== */

// Formatea un número como guaraníes: 75000 -> "Gs. 75.000"
function formatearGuaranies(numero) {
  // La expresión regular pone un punto cada tres dígitos desde la derecha
  return "Gs. " + String(numero).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Arma el enlace de WhatsApp con el texto ya escrito.
// encodeURIComponent convierte espacios, tildes y saltos de línea
// a un formato que se puede poner en una URL.
function enlaceWhatsApp(mensaje) {
  return "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(mensaje);
}

// Decide si un color es oscuro, para elegir un color de estampa que se vea.
// Calcula el brillo aproximado a partir del código hex (#rrggbb).
function esOscuro(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brillo = (r * 299 + g * 587 + b * 114) / 1000; // de 0 a 255
  return brillo < 140;
}


/* =====================================================================
   2. ILUSTRACIONES SVG
   ---------------------------------------------------------------------
   Cada categoría tiene una "silueta" y cada producto una "estampa".
   Todo se dibuja en un lienzo de 200 x 200 (viewBox="0 0 200 200").
   ===================================================================== */

// Siluetas: cada función recibe el color de fondo del producto.
const SILUETAS = {
  remeras: (c) => `
    <path d="M62 42 L82 30 Q100 46 118 30 L138 42 L170 70 L150 94 L138 84 L138 172 L62 172 L62 84 L50 94 L30 70 Z"
          fill="${c}" stroke="${CONTORNO}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M82 30 Q100 46 118 30" fill="none" stroke="${CONTORNO}" stroke-width="3"/>`,

  buzos: (c) => `
    <path d="M62 44 L80 32 Q100 50 120 32 L138 44 L162 72 L176 156 L154 160 L140 96 L140 172 L60 172 L60 96 L46 160 L24 156 L38 72 Z"
          fill="${c}" stroke="${CONTORNO}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M80 32 Q100 70 120 32" fill="none" stroke="${CONTORNO}" stroke-width="3"/>
    <path d="M76 146 H124 V172 H76 Z" fill="none" stroke="${CONTORNO}" stroke-width="2.5" opacity=".6"/>`,

  tazas: (c) => `
    <path d="M142 82 h10 a24 24 0 0 1 0 48 h-10" fill="none" stroke="${CONTORNO}" stroke-width="10" stroke-linecap="round"/>
    <path d="M142 82 h10 a24 24 0 0 1 0 48 h-10" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>
    <path d="M48 62 H142 V156 Q142 170 128 170 H62 Q48 170 48 156 Z"
          fill="${c}" stroke="${CONTORNO}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="95" cy="62" rx="47" ry="8" fill="${c}" stroke="${CONTORNO}" stroke-width="3"/>
    <ellipse cx="95" cy="62" rx="38" ry="4" fill="${CONTORNO}" opacity=".25"/>`,

  gorras: (c) => `
    <path d="M38 124 Q100 108 182 126 Q176 144 108 140 Q52 140 38 124 Z"
          fill="${c}" stroke="${CONTORNO}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M44 124 Q44 56 100 56 Q156 56 156 124 Q100 112 44 124 Z"
          fill="${c}" stroke="${CONTORNO}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M100 56 Q92 90 96 118" fill="none" stroke="${CONTORNO}" stroke-width="2" opacity=".5"/>
    <circle cx="100" cy="56" r="5" fill="${CONTORNO}"/>`,

  bolsos: (c) => `
    <path d="M74 80 Q74 34 100 34 Q126 34 126 80" fill="none" stroke="${CONTORNO}" stroke-width="7"/>
    <path d="M48 78 H152 L158 174 H42 Z"
          fill="${c}" stroke="${CONTORNO}" stroke-width="3" stroke-linejoin="round"/>`,

  almohadones: (c) => `
    <path d="M38 42 Q100 28 162 42 Q174 100 162 158 Q100 172 38 158 Q26 100 38 42 Z"
          fill="${c}" stroke="${CONTORNO}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M50 52 Q100 42 150 52" fill="none" stroke="${CONTORNO}" stroke-width="1.5" opacity=".3"/>`
};

// Dónde va la estampa en cada silueta: centro (x, y) y escala.
const ZONA_ESTAMPA = {
  remeras:     { x: 100, y: 108, escala: 1 },
  buzos:       { x: 100, y: 104, escala: 0.9 },
  tazas:       { x: 95,  y: 114, escala: 0.85 },
  gorras:      { x: 100, y: 94,  escala: 0.6 },
  bolsos:      { x: 100, y: 128, escala: 0.9 },
  almohadones: { x: 100, y: 100, escala: 1.15 }
};

// Estampas: dibujadas alrededor del punto (0, 0). "t" es el color de tinta
// y "a" un color de acento.
const ESTAMPAS = {
  sol: (t, a) => {
    let rayos = "";
    for (let i = 0; i < 12; i++) {
      // Rotamos una línea 30° cada vez para hacer los rayos del sol
      rayos += `<line x1="0" y1="-20" x2="0" y2="-30" transform="rotate(${i * 30})"/>`;
    }
    return `<circle r="14" fill="${a}"/>
            <g stroke="${a}" stroke-width="4" stroke-linecap="round">${rayos}</g>`;
  },

  flor: (t, a) => {
    let petalos = "";
    for (let i = 0; i < 8; i++) {
      petalos += `<ellipse cx="0" cy="-17" rx="7" ry="15" transform="rotate(${i * 45})"/>`;
    }
    return `<g fill="${a}" opacity=".9">${petalos}</g>
            <circle r="9" fill="${t}"/>
            <circle r="4" fill="${a}"/>`;
  },

  ruta: (t, a) => `
    <path d="M-26 -22 H26 V8 Q26 24 0 32 Q-26 24 -26 8 Z" fill="${a}" stroke="${t}" stroke-width="3"/>
    <text y="-4" text-anchor="middle" font-family="Bricolage Grotesque, sans-serif" font-weight="800" font-size="11" fill="${t}">RUTA</text>
    <text y="20" text-anchor="middle" font-family="Bricolage Grotesque, sans-serif" font-weight="800" font-size="22" fill="${t}">2</text>`,

  mate: (t, a) => `
    <line x1="6" y1="-6" x2="20" y2="-36" stroke="${t}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M-16 -10 H18 L12 26 Q0 32 -10 26 Z" fill="${a}" stroke="${t}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M-12 2 H14" stroke="${t}" stroke-width="2" opacity=".6"/>`,

  texto: (t, a, frase) => `
    <text y="6" text-anchor="middle" font-family="Bricolage Grotesque, sans-serif"
          font-weight="800" font-size="${frase.length > 8 ? 15 : 18}" fill="${t}">${frase}</text>
    <path d="M-30 14 Q0 22 30 14" fill="none" stroke="${a}" stroke-width="3" stroke-linecap="round"/>`,

  liso: () => ""
};

// Junta silueta + estampa y devuelve el SVG completo como texto.
function dibujarProducto(producto, colorHex) {
  const silueta = SILUETAS[producto.categoria](colorHex);
  const zona = ZONA_ESTAMPA[producto.categoria];

  // Si el producto es oscuro, la estampa va en tonos claros, y al revés.
  const tinta = esOscuro(colorHex) ? "#fbf3e4" : CONTORNO;
  const acento = colorHex.toLowerCase() === "#e9a23b" ? "#c8553d" : "#e9a23b";

  const estampa = ESTAMPAS[producto.estampa](tinta, acento, producto.textoEstampa || "");

  return `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img"
         aria-label="${producto.nombre}">
      ${silueta}
      <g transform="translate(${zona.x} ${zona.y}) scale(${zona.escala})">${estampa}</g>
    </svg>`;
}


/* =====================================================================
   3. TARJETAS DE PRODUCTO
   ===================================================================== */

const grilla = document.getElementById("grilla-productos");

// Crea el HTML de una tarjeta. Los talles y colores son "radio buttons"
// (solo se puede elegir uno) con diseño de botoncitos.
function crearTarjeta(producto) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "producto";
  tarjeta.dataset.categoria = producto.categoria;

  // Si hay un solo talle, lo dejamos elegido de entrada.
  const unSoloTalle = producto.talles.length === 1;

  const opcionesTalle = producto.talles.map((talle) => `
    <label class="opcion-talle">
      <input type="radio" name="talle-${producto.id}" value="${talle}" ${unSoloTalle ? "checked" : ""}>
      <span>${talle}</span>
    </label>`).join("");

  // El primer color viene elegido por defecto.
  const opcionesColor = producto.colores.map((color, i) => `
    <label class="opcion-color" title="${color.nombre}">
      <input type="radio" name="color-${producto.id}" value="${color.nombre}" data-hex="${color.hex}" ${i === 0 ? "checked" : ""}>
      <span style="--muestra: ${color.hex}"></span>
      <em class="solo-lectores">${color.nombre}</em>
    </label>`).join("");

  tarjeta.innerHTML = `
    <div class="producto__imagen">
      ${producto.destacado ? '<span class="insignia">Más pedido</span>' : ""}
      <div class="producto__dibujo">${dibujarProducto(producto, producto.colores[0].hex)}</div>
    </div>
    <div class="producto__cuerpo">
      <p class="producto__categoria">${CATEGORIAS[producto.categoria]}</p>
      <h3>${producto.nombre}</h3>
      <p class="producto__descripcion">${producto.descripcion}</p>
      <p class="producto__precio">${formatearGuaranies(producto.precio)}</p>

      <fieldset class="selector ${unSoloTalle ? "selector--unico" : ""}">
        <legend>Talle${unSoloTalle ? "" : ": <b class='elegido-talle'>elegí uno</b>"}</legend>
        <div class="selector__opciones">${opcionesTalle}</div>
      </fieldset>

      <fieldset class="selector">
        <legend>Color: <b class="elegido-color">${producto.colores[0].nombre}</b></legend>
        <div class="selector__opciones">${opcionesColor}</div>
      </fieldset>

      <a class="boton boton--whatsapp boton--ancho" target="_blank" rel="noopener">
        <span class="icono-wa" aria-hidden="true"></span>
        Pedir por WhatsApp
      </a>
      <p class="producto__aviso" role="alert"></p>
    </div>`;

  // Referencias a partes de la tarjeta que vamos a actualizar
  const dibujo = tarjeta.querySelector(".producto__dibujo");
  const boton = tarjeta.querySelector(".boton--whatsapp");
  const aviso = tarjeta.querySelector(".producto__aviso");
  const textoColor = tarjeta.querySelector(".elegido-color");
  const textoTalle = tarjeta.querySelector(".elegido-talle");

  // Lee qué talle y color están marcados ahora mismo
  function seleccionActual() {
    const talle = tarjeta.querySelector(`input[name="talle-${producto.id}"]:checked`);
    const color = tarjeta.querySelector(`input[name="color-${producto.id}"]:checked`);
    return {
      talle: talle ? talle.value : null,
      color: color.value,
      hex: color.dataset.hex
    };
  }

  // Arma el mensaje y lo pone en el enlace del botón
  function actualizarBoton() {
    const { talle, color } = seleccionActual();
    const lineas = [
      `¡Hola, ${NOMBRE_TIENDA}! Quiero pedir:`,
      `• Producto: ${producto.nombre}`,
      unSoloTalle ? null : `• Talle: ${talle}`, // si es talle único, no hace falta
      `• Color: ${color}`,
      `• Precio: ${formatearGuaranies(producto.precio)}`,
      "",
      "¿Está disponible?"
    ];
    // filter quita las líneas que quedaron en null
    boton.href = enlaceWhatsApp(lineas.filter((l) => l !== null).join("\n"));
  }

  // Cada vez que cambia un talle o un color...
  tarjeta.addEventListener("change", (evento) => {
    const { talle, color, hex } = seleccionActual();

    if (evento.target.name.startsWith("color")) {
      dibujo.innerHTML = dibujarProducto(producto, hex); // redibujamos con el nuevo color
      textoColor.textContent = color;
    }
    if (textoTalle && talle) textoTalle.textContent = talle;

    aviso.textContent = "";
    actualizarBoton();
  });

  // Si el cliente no eligió talle, frenamos el clic y le avisamos
  boton.addEventListener("click", (evento) => {
    if (!seleccionActual().talle) {
      evento.preventDefault();
      aviso.textContent = "Elegí un talle antes de pedir.";
      tarjeta.querySelector(".selector").classList.add("selector--falta");
      setTimeout(() => tarjeta.querySelector(".selector").classList.remove("selector--falta"), 600);
    }
  });

  actualizarBoton();
  return tarjeta;
}

// Recorre la lista y agrega todas las tarjetas a la grilla
function mostrarProductos() {
  grilla.innerHTML = "";
  PRODUCTOS.forEach((producto) => grilla.appendChild(crearTarjeta(producto)));
}


/* =====================================================================
   4. FILTROS POR CATEGORÍA
   ===================================================================== */

const contenedorFiltros = document.getElementById("filtros");

function crearFiltros() {
  // Solo mostramos categorías que tienen al menos un producto
  const usadas = Object.keys(CATEGORIAS).filter((clave) =>
    PRODUCTOS.some((p) => p.categoria === clave)
  );

  const botones = [["todos", "Todos", PRODUCTOS.length]].concat(
    usadas.map((clave) => [
      clave,
      CATEGORIAS[clave],
      PRODUCTOS.filter((p) => p.categoria === clave).length
    ])
  );

  contenedorFiltros.innerHTML = botones.map(([clave, nombre, cantidad]) => `
    <button type="button" class="filtro" data-filtro="${clave}" aria-pressed="${clave === "todos"}">
      ${nombre} <small>${cantidad}</small>
    </button>`).join("");

  contenedorFiltros.addEventListener("click", (evento) => {
    const boton = evento.target.closest(".filtro");
    if (!boton) return;
    aplicarFiltro(boton.dataset.filtro);
  });
}

function aplicarFiltro(categoria) {
  // Marcamos el botón activo
  contenedorFiltros.querySelectorAll(".filtro").forEach((b) => {
    b.setAttribute("aria-pressed", b.dataset.filtro === categoria);
  });
  // Ocultamos las tarjetas que no son de esa categoría
  grilla.querySelectorAll(".producto").forEach((tarjeta) => {
    const coincide = categoria === "todos" || tarjeta.dataset.categoria === categoria;
    tarjeta.hidden = !coincide;
  });
}


/* =====================================================================
   5. PEDIDOS PERSONALIZADOS
   ===================================================================== */

const formulario = document.getElementById("form-personalizado");
const selectProducto = document.getElementById("select-personalizado");
const botonPersonalizado = document.getElementById("enviar-personalizado");
const errorPersonalizado = document.getElementById("error-personalizado");

function prepararFormulario() {
  // Las opciones del select salen de las categorías
  selectProducto.innerHTML =
    Object.values(CATEGORIAS).map((nombre) => `<option>${nombre}</option>`).join("") +
    "<option>Otro (lo explico abajo)</option>";

  // Cada vez que se escribe algo, actualizamos el enlace
  formulario.addEventListener("input", armarMensajePersonalizado);
  formulario.addEventListener("change", armarMensajePersonalizado);

  // Si falta el nombre, no dejamos abrir WhatsApp
  botonPersonalizado.addEventListener("click", (evento) => {
    if (!formulario.reportValidity()) {
      evento.preventDefault();
      errorPersonalizado.textContent = "Completá tu nombre y la cantidad.";
    }
  });

  // Por si alguien aprieta Enter dentro del formulario
  formulario.addEventListener("submit", (evento) => evento.preventDefault());

  armarMensajePersonalizado();
}

function armarMensajePersonalizado() {
  const datos = new FormData(formulario);
  errorPersonalizado.textContent = "";

  // Si eligió fecha, la pasamos de 2026-12-24 a 24/12/2026
  let fecha = datos.get("fecha");
  if (fecha) fecha = fecha.split("-").reverse().join("/");

  const lineas = [
    `¡Hola, ${NOMBRE_TIENDA}! Soy ${datos.get("nombre") || "…"} y quiero un pedido personalizado:`,
    `• Producto: ${datos.get("producto")}`,
    `• Cantidad: ${datos.get("cantidad")}`,
    fecha ? `• Lo necesito para: ${fecha}` : null,
    datos.get("detalle") ? `• Idea: ${datos.get("detalle")}` : null,
    "",
    "Te adjunto mi diseño en este chat."
  ];
  botonPersonalizado.href = enlaceWhatsApp(lineas.filter((l) => l !== null).join("\n"));
}


/* =====================================================================
   6. DETALLES: portada y botón flotante
   ===================================================================== */

function dibujarPortada() {
  // Reutilizamos la misma función de dibujo con productos de ejemplo
  const remera = PRODUCTOS.find((p) => p.id === 1);
  const taza = PRODUCTOS.find((p) => p.id === 7);
  const gorra = PRODUCTOS.find((p) => p.id === 8);
  document.getElementById("ilustracion-portada").innerHTML = `
    <div class="portada__pieza portada__pieza--1">${dibujarProducto(remera, "#e9a23b")}</div>
    <div class="portada__pieza portada__pieza--2">${dibujarProducto(taza, "#f7f3ea")}</div>
    <div class="portada__pieza portada__pieza--3">${dibujarProducto(gorra, "#2d6a4f")}</div>`;
}

document.getElementById("wa-flotante").href =
  enlaceWhatsApp(`¡Hola, ${NOMBRE_TIENDA}! Tengo una consulta.`);


/* =====================================================================
   ARRANQUE: cuando se carga la página, ejecutamos todo
   ===================================================================== */
dibujarPortada();
crearFiltros();
mostrarProductos();
prepararFormulario();
