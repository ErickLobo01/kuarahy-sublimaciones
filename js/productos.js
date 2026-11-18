/* =====================================================================
   PRODUCTOS DE LA TIENDA
   ---------------------------------------------------------------------
   Esta es la "base de datos" de la tienda: una lista (array) de objetos.
   Para agregar un producto, copiá un bloque { ... }, pegalo al final
   (separado por coma) y cambiá los datos.

   Campos de cada producto:
     id          -> número único (no se puede repetir)
     nombre      -> lo que se muestra en la tarjeta
     categoria   -> tiene que coincidir con una clave de CATEGORIAS (abajo)
     precio      -> en guaraníes, SIN puntos (65000, no 65.000)
     talles      -> lista de talles. Si no lleva talle, poné ["Único"]
     colores     -> lista de { nombre, hex }. El hex es el color del dibujo
     estampa     -> el motivo que se dibuja: "sol", "flor", "ruta", "mate",
                    "texto" o "liso"
     descripcion -> texto corto
     textoEstampa-> (opcional) la frase que se dibuja si estampa es "texto"
     destacado   -> (opcional) true para mostrar la etiqueta "Más pedido"

   ---------------------------------------------------------------------
   MÁS ADELANTE: CARGAR LOS PRODUCTOS DESDE UNA PLANILLA DE GOOGLE
   ---------------------------------------------------------------------
   1) Armá una planilla de Google Sheets con una fila por producto y
      estas columnas (la primera fila son los títulos):
        id | nombre | categoria | precio | talles | colores | estampa | descripcion
      - En "talles" separá con barra vertical:   S|M|L|XL
      - En "colores" usá nombre:hex separados por barra vertical:
            Blanco:#f5f1e8|Negro:#2b2b2b|Rojo:#c8553d
      (Usamos "|" y no comas porque el CSV ya usa la coma para separar
      columnas. Por eso tampoco pongas comas en nombre ni descripción.)

   2) En la planilla: Archivo > Compartir > Publicar en la Web >
      elegí la hoja y el formato "Valores separados por comas (.csv)".
      Te da un enlace que termina en "output=csv".

   3) En app.js, en vez de usar PRODUCTOS directamente, leés ese CSV con
      fetch() y convertís cada fila en un objeto igual a los de abajo.
      Un ejemplo (simplificado, no maneja comas dentro de comillas):

      const URL_CSV = "https://docs.google.com/spreadsheets/d/e/XXXX/pub?output=csv";

      async function cargarDesdePlanilla() {
        const respuesta = await fetch(URL_CSV);
        const texto = await respuesta.text();
        const filas = texto.trim().split("\n").slice(1); // saltamos los títulos
        return filas.map(fila => {
          const [id, nombre, categoria, precio, talles, colores, estampa, descripcion] =
            fila.split(","); // cada columna viene separada por coma
          return {
            id: Number(id),
            nombre,
            categoria,
            precio: Number(precio),
            talles: talles.split("|"),
            colores: colores.split("|").map(c => {
              const [nombre, hex] = c.split(":");
              return { nombre, hex };
            }),
            estampa,
            descripcion
          };
        });
      }

      Así, para cambiar un precio solo editás la planilla, sin tocar el código.
      (Nota: esto funciona cuando subís la página a tu propio hosting.
      En la vista previa publicada en Claude las peticiones a otros
      sitios están bloqueadas.)
   ===================================================================== */

// Nombre visible de cada categoría (la clave es la que va en "categoria")
const CATEGORIAS = {
  remeras: "Remeras",
  buzos: "Buzos",
  tazas: "Tazas",
  gorras: "Gorras",
  bolsos: "Bolsos",
  almohadones: "Almohadones"
};

// Colores que se repiten en varios productos (así no los escribimos cada vez)
const BLANCO   = { nombre: "Blanco",   hex: "#f7f3ea" };
const NEGRO    = { nombre: "Negro",    hex: "#2b2622" };
const TERRACOTA = { nombre: "Terracota", hex: "#c8553d" };
const MOSTAZA  = { nombre: "Mostaza",  hex: "#e9a23b" };
const VERDE    = { nombre: "Verde monte", hex: "#2d6a4f" };
const CELESTE  = { nombre: "Celeste",  hex: "#8ec5d6" };
const ROSA     = { nombre: "Rosa viejo", hex: "#d99a9a" };
const CRUDO    = { nombre: "Crudo",    hex: "#e8dcc4" };

const PRODUCTOS = [
  {
    id: 1,
    nombre: "Remera Kuarahy",
    categoria: "remeras",
    precio: 75000,
    talles: ["S", "M", "L", "XL", "XXL"],
    colores: [BLANCO, NEGRO, MOSTAZA, VERDE],
    estampa: "sol",
    descripcion: "Algodón peinado 24/1. Estampa de sol al frente.",
    destacado: true
  },
  {
    id: 2,
    nombre: "Remera Mburucuyá",
    categoria: "remeras",
    precio: 75000,
    talles: ["S", "M", "L", "XL"],
    colores: [BLANCO, ROSA, CELESTE],
    estampa: "flor",
    descripcion: "Flor de mburucuyá ilustrada. Corte unisex."
  },
  {
    id: 3,
    nombre: "Remera Ruta 2",
    categoria: "remeras",
    precio: 80000,
    talles: ["S", "M", "L", "XL", "XXL"],
    colores: [NEGRO, TERRACOTA, CRUDO],
    estampa: "ruta",
    descripcion: "Para los que siempre andan de viaje al interior."
  },
  {
    id: 4,
    nombre: "Remera básica lisa",
    categoria: "remeras",
    precio: 55000,
    talles: ["XS", "S", "M", "L", "XL", "XXL"],
    colores: [BLANCO, NEGRO, TERRACOTA, MOSTAZA, VERDE, CELESTE],
    estampa: "liso",
    descripcion: "Ideal para sublimar tu propio diseño después."
  },
  {
    id: 5,
    nombre: "Buzo Tereré Jarei",
    categoria: "buzos",
    precio: 165000,
    talles: ["S", "M", "L", "XL"],
    colores: [CRUDO, VERDE, NEGRO],
    estampa: "mate",
    descripcion: "Frisa invierno con capucha. Guampa bordada al frente."
  },
  {
    id: 6,
    nombre: "Taza mágica",
    categoria: "tazas",
    precio: 45000,
    talles: ["Único"],
    colores: [NEGRO],
    estampa: "sol",
    descripcion: "Negra en frío; con algo caliente aparece el diseño.",
    destacado: true
  },
  {
    id: 7,
    nombre: "Taza cerámica 11 oz",
    categoria: "tazas",
    precio: 35000,
    talles: ["Único"],
    colores: [BLANCO, ROSA, CELESTE],
    estampa: "texto",
    textoEstampa: "Che ra'a",
    descripcion: "Con la frase “Che ra'a”. Apta microondas."
  },
  {
    id: 8,
    nombre: "Gorra trucker",
    categoria: "gorras",
    precio: 60000,
    talles: ["Único (regulable)"],
    colores: [NEGRO, TERRACOTA, VERDE, CRUDO],
    estampa: "sol",
    descripcion: "Frente de espuma sublimable y malla atrás."
  },
  {
    id: 9,
    nombre: "Gorra de gabardina",
    categoria: "gorras",
    precio: 70000,
    talles: ["Único (regulable)"],
    colores: [MOSTAZA, CRUDO, NEGRO],
    estampa: "flor",
    descripcion: "Seis paneles, cierre con hebilla metálica."
  },
  {
    id: 10,
    nombre: "Tote bag Mercado 4",
    categoria: "bolsos",
    precio: 50000,
    talles: ["Único"],
    colores: [CRUDO, NEGRO],
    estampa: "texto",
    textoEstampa: "Mercado 4",
    descripcion: "Lienzo resistente para las compras de todos los días."
  },
  {
    id: 11,
    nombre: "Almohadón Ñandutí",
    categoria: "almohadones",
    precio: 85000,
    talles: ["40 x 40 cm", "50 x 50 cm"],
    colores: [BLANCO, MOSTAZA, TERRACOTA],
    estampa: "flor",
    descripcion: "Funda sublimada con relleno incluido."
  }
];
