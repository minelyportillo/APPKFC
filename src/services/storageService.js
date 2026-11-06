/**
 * ============================================================
 * storageService.js — Persistencia, Seed Data y Formateadores KFC (React)
 * ============================================================
 * Cátedra: DAW901 — Universidad Don Bosco
 * Módulo: Persistencia Global, Catálogo y Pedidos
 * Autor: Daniel Alexander Benavides Rivera
 * ============================================================
 */

export const STORAGE_KEYS = {
  USERS: 'kfc_users',
  SESSION: 'kfc_session',
  MENU: 'kfc_menu',
  ORDERS: 'kfc_orders'
};

export const ESTADOS_PEDIDO = {
  PENDIENTE: 'pendiente',
  EN_PREPARACION: 'en_preparacion',
  LISTO: 'listo',
  ENTREGADO: 'entregado',
  CANCELADO: 'cancelado'
};

export const INITIAL_MENU = [
  {
    id: 'PRD-01',
    categoria: 'Combos',
    nombre: 'Mega Pack Familiar',
    precio: 24.99,
    stock: 35,
    img: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80',
    imgFallback: '/img/productos/prd-01.svg',
    descripcion: '8 piezas de pollo crujiente, 4 biscuits y 2 complementos familiares'
  },
  {
    id: 'PRD-02',
    categoria: 'Combos',
    nombre: 'Wow Pack 4 Piezas',
    precio: 13.99,
    stock: 40,
    img: '/img/productos/wow-pack.png',
    descripcion: '4 piezas de pollo originales, 3 puré con gravy pequeños, 2 hamburguesas Jr. Coronel y 3 biscuits'
  },
  {
    id: 'PRD-03',
    categoria: 'Boxes',
    nombre: 'Combo Kruncher Box',
    precio: 8.50,
    stock: 50,
    img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    imgFallback: '/img/productos/prd-03.svg',
    descripcion: 'Hamburguesa Kruncher, 1 pieza de pollo, papas y bebida'
  },
  {
    id: 'PRD-04',
    categoria: 'Pollo',
    nombre: 'Pollo Frito Tradicional (2 Pzs)',
    precio: 4.75,
    stock: 65,
    img: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&q=80',
    imgFallback: '/img/productos/prd-04.svg',
    descripcion: '2 jugosas piezas con la receta secreta original del Coronel'
  },
  {
    id: 'PRD-05',
    categoria: 'Pollo',
    nombre: 'Combo Boneless Dippers',
    precio: 6.50,
    stock: 4, // Stock crítico (< 5) para pruebas de alerta visual
    img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80',
    imgFallback: '/img/productos/prd-05.svg',
    descripcion: 'Trocitos de pechuga empanizados con salsa BBQ'
  },
  {
    id: 'PRD-06',
    categoria: 'Complementos',
    nombre: 'Papas Fritas Medianas',
    precio: 2.25,
    stock: 80,
    img: '/img/productos/papas-fritas-medianas.png',
    descripcion: 'Papas doradas al estilo crujiente y sazonadas'
  },
  {
    id: 'PRD-07',
    categoria: 'Complementos',
    nombre: 'Puré de Papa con Gravy',
    precio: 1.50,
    stock: 3, // Stock crítico (< 5)
    img: '/img/productos/pure-gravy.png',
    descripcion: 'Clásico puré suave bañado con salsa gravy tradicional'
  },
  {
    id: 'PRD-08',
    categoria: 'Bebidas',
    nombre: 'Gaseosa en Lata 355ml',
    precio: 1.25,
    stock: 120,
    img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
    imgFallback: '/img/productos/prd-08.svg',
    descripcion: 'Pepsi, Pepsi Black, 7Up o Mirinda bien fría'
  },
  {
    id: 'PRD-21',
    categoria: 'Boxes',
    nombre: 'Big Kruncher',
    precio: 9.00,
    stock: 40,
    img: '/img/productos/big-kruncher.png',
    descripcion: 'Hamburguesa Big Kruncher BBQ, 1 pieza de pollo original, 1 papa mediana, 1 ensalada y 1 soda de lata Pepsi'
  },
  {
    id: 'PRD-22',
    categoria: 'Boxes',
    nombre: 'Big Box XL',
    precio: 9.99,
    stock: 40,
    img: '/img/productos/big-box-xl.png',
    descripcion: 'Big Kruncher XL Buffalo, 1 pieza de pollo original, 1 papa mediana, 1 ensalada y 1 soda de lata Pepsi'
  },
  {
    id: 'PRD-23',
    categoria: 'Pollo',
    nombre: 'Trío Coronel',
    precio: 8.20,
    stock: 40,
    img: '/img/productos/trio-coronel.png',
    descripcion: '3 piezas de pollo originales, 1 puré con gravy pequeño, 1 biscuit y 1 soda de lata Pepsi'
  },
  {
    id: 'PRD-24',
    categoria: 'Pollo',
    nombre: 'Trío Full',
    precio: 8.95,
    stock: 40,
    img: '/img/productos/trio-full.png',
    descripcion: '3 piezas de pollo originales, 1 puré con gravy pequeño, 1 biscuit, 1 papa mediana y 1 soda de lata Pepsi'
  },
  {
    id: 'PRD-25',
    categoria: 'Combos',
    nombre: 'Wow Bucket',
    precio: 9.80,
    stock: 40,
    img: '/img/productos/wow-bucket.png',
    descripcion: '6 piezas de pollo originales, 3 puré con gravy pequeños y 1 Pepsi de 1.5 Lts'
  },
  {
    id: 'PRD-26',
    categoria: 'Bebidas',
    nombre: 'Soda 1.5 Lts',
    precio: 2.50,
    stock: 40,
    img: '/img/productos/soda-1-5l.png',
    descripcion: 'Soda Pepsi de 1.5 litros, ideal para compartir'
  },
  {
    id: 'PRD-27',
    categoria: 'Complementos',
    nombre: 'Pie Queso Berry',
    precio: 1.50,
    stock: 40,
    img: '/img/productos/pie-queso-berry.png',
    descripcion: 'Pie crujiente relleno de queso y berry'
  },
  {
    id: 'PRD-28',
    categoria: 'Bebidas',
    nombre: 'Botella con Agua',
    precio: 1.20,
    stock: 40,
    img: '/img/productos/botella-agua.png',
    descripcion: 'Botella de agua para acompañar tu pedido'
  }
];

// Platos que se quitaron del catálogo: se eliminan de los menús ya guardados en el navegador
const RETIRED_PRODUCT_IDS = new Set([
  'PRD-09', 'PRD-10', 'PRD-11', 'PRD-12', 'PRD-13',
  'PRD-14', 'PRD-15', 'PRD-16', 'PRD-17', 'PRD-18'
]);

/**
 * Sincroniza el menú guardado en localStorage con el catálogo actual (INITIAL_MENU):
 * - agrega los platillos nuevos que aún no existen,
 * - actualiza imagen, nombre, descripción, precio y categoría de los existentes,
 * - conserva el stock que ya tenía cada producto.
 */
export function mergeMenu(storedMenu) {
  const stored = Array.isArray(storedMenu) ? storedMenu : [];
  const storedById = new Map(stored.map(p => [p.id, p]));
  const merged = INITIAL_MENU.map(seed => {
    const previous = storedById.get(seed.id);
    return previous ? { ...seed, stock: Number.isInteger(previous.stock) ? previous.stock : seed.stock } : seed;
  });
  const seedIds = new Set(INITIAL_MENU.map(p => p.id));
  const extras = stored.filter(p => p && !seedIds.has(p.id) && !RETIRED_PRODUCT_IDS.has(p.id));
  return [...merged, ...extras];
}

export const INITIAL_ORDERS = () => {
  const hoy = new Date();
  const hace1Hora = new Date(hoy.getTime() - 60 * 60 * 1000).toISOString();
  const hace3Horas = new Date(hoy.getTime() - 3 * 60 * 60 * 1000).toISOString();
  const hace5Horas = new Date(hoy.getTime() - 5 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'PED-001',
      cliente: 'Carlos Mendoza',
      cajeroId: 'USR-02',
      cajeroNombre: 'Cajero Principal',
      tipoPago: 'Efectivo',
      estado: ESTADOS_PEDIDO.ENTREGADO,
      fecha: hace5Horas,
      items: [
        { id: 'PRD-01', nombre: 'Mega Pack Familiar', precio: 24.99, quantity: 1, subtotal: 24.99 },
        { id: 'PRD-08', nombre: 'Gaseosa en Lata 355ml', precio: 1.25, quantity: 2, subtotal: 2.50 }
      ],
      subtotal: 24.33,
      iva: 3.16,
      total: 27.49
    },
    {
      id: 'PED-002',
      cliente: 'Mariana Flores',
      cajeroId: 'USR-02',
      cajeroNombre: 'Cajero Principal',
      tipoPago: 'Digital',
      estado: ESTADOS_PEDIDO.EN_PREPARACION,
      fecha: hace3Horas,
      items: [
        { id: 'PRD-03', nombre: 'Combo Kruncher Box', precio: 8.50, quantity: 2, subtotal: 17.00 }
      ],
      subtotal: 15.04,
      iva: 1.96,
      total: 17.00
    },
    {
      id: 'PED-003',
      cliente: 'Roberto Palacios',
      cajeroId: 'USR-02',
      cajeroNombre: 'Cajero Principal',
      tipoPago: 'Efectivo',
      estado: ESTADOS_PEDIDO.PENDIENTE,
      fecha: hace1Hora,
      items: [
        { id: 'PRD-04', nombre: 'Pollo Frito Tradicional (2 Pzs)', precio: 4.75, quantity: 1, subtotal: 4.75 },
        { id: 'PRD-06', nombre: 'Papas Fritas Medianas', precio: 2.25, quantity: 1, subtotal: 2.25 }
      ],
      subtotal: 6.19,
      iva: 0.81,
      total: 7.00
    },
    {
      id: 'PED-004',
      cliente: 'Andrea Gómez',
      cajeroId: 'USR-02',
      cajeroNombre: 'Cajero Principal',
      tipoPago: 'Digital',
      estado: ESTADOS_PEDIDO.CANCELADO,
      fecha: hace5Horas,
      items: [
        { id: 'PRD-02', nombre: 'Wow Pack 4 Piezas', precio: 13.99, quantity: 1, subtotal: 13.99 }
      ],
      subtotal: 12.38,
      iva: 1.61,
      total: 13.99
    }
  ];
};

/**
 * Formatea valor a moneda estadounidense ($XX.XX)
 */
export function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

/**
 * Formatea fechas a horario local de El Salvador (es-SV)
 */
export function formatDate(dateInput, includeTime = true) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = true;
  }

  return date.toLocaleString('es-SV', options);
}

/**
 * Validador de número positivo
 */
export function isPositiveNumber(val) {
  const num = parseFloat(val);
  return !isNaN(num) && num > 0;
}

/**
 * Validador de texto no vacío
 */
export function isNonEmptyString(str) {
  return typeof str === 'string' && str.trim().length > 0;
}

export function isValidPersonName(name) {
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  return normalizedName.length >= 2
    && normalizedName.length <= 60
    && /^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u.test(normalizedName);
}

export function isValidEmail(email) {
  const normalizedEmail = typeof email === 'string' ? email.trim() : '';
  return normalizedEmail.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
}

export function isValidCardNumber(value) {
  const digits = typeof value === 'string' ? value.replace(/\D/g, '') : '';
  if (!/^\d{13,19}$/.test(digits)) return false;

  let sum = 0;
  let doubleDigit = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }

  return sum % 10 === 0;
}

export function isValidCardExpiry(monthValue, yearValue) {
  if (!/^\d{2}$/.test(monthValue) || !/^\d{2}$/.test(yearValue)) return false;

  const month = Number(monthValue);
  const year = 2000 + Number(yearValue);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  return year > now.getFullYear()
    || (year === now.getFullYear() && month >= now.getMonth() + 1);
}

/**
 * Convierte un monto a centavos enteros para evitar errores de decimales
 * (por ejemplo 0.1 + 0.2). Todos los cálculos de dinero se hacen en centavos.
 */
export function toCents(amount) {
  return Math.round((parseFloat(amount) || 0) * 100);
}

/**
 * Cambio a devolver = monto recibido - total (en dólares, 2 decimales).
 */
export function calculateChange(received, total) {
  return (toCents(received) - toCents(total)) / 100;
}

/**
 * Valida el monto recibido en efectivo: número positivo de hasta 2 decimales,
 * máximo 999,999.99 y que alcance a cubrir el total del pedido.
 */
export function isValidCashAmount(value, total) {
  const text = typeof value === 'string' ? value.trim() : String(value ?? '');
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(text)) return false;
  const cents = toCents(text);
  return cents > 0 && cents >= toCents(total);
}

export function isValidCardCvv(value) {
  return /^\d{3,4}$/.test(typeof value === 'string' ? value : '');
}
