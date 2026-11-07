import { createContext, useContext, useState, useEffect } from 'react';
import {
  STORAGE_KEYS,
  ESTADOS_PEDIDO,
  INITIAL_MENU,
  INITIAL_ORDERS,
  mergeMenu,
  isValidEmail,
  isValidPersonName,
  isValidCashAmount,
  calculateChange
} from '../services/storageService';

const ROLES = {
  ADMIN: 'admin',
  CAJERO: 'cajero'
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cashCuts, setCashCuts] = useState([]);

  useEffect(() => {
    // 1. Inicializar Usuarios Semilla
    seedUsers();

    // 2. Cargar Sesión Activa
    const storedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (storedSession) {
      try {
        setUser(JSON.parse(storedSession));
      } catch (e) {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      }
    }

    // 3. Inicializar Catálogo de Menú KFC
    const storedMenu = localStorage.getItem(STORAGE_KEYS.MENU);
    if (storedMenu) {
      try {
        // Sincroniza con el catálogo actual (platillos nuevos e imágenes) conservando el stock
        const syncedMenu = mergeMenu(JSON.parse(storedMenu));
        setProducts(syncedMenu);
        localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(syncedMenu));
      } catch (e) {
        setProducts(INITIAL_MENU);
        localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(INITIAL_MENU));
      }
    } else {
      setProducts(INITIAL_MENU);
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(INITIAL_MENU));
    }

    // 4. Inicializar Pedidos de Prueba
    const storedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (storedOrders) {
      try {
        setOrders(JSON.parse(storedOrders));
      } catch (e) {
        const defaultOrders = INITIAL_ORDERS();
        setOrders(defaultOrders);
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(defaultOrders));
      }
    } else {
      const defaultOrders = INITIAL_ORDERS();
      setOrders(defaultOrders);
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(defaultOrders));
    }

    const storedCashCuts = localStorage.getItem(STORAGE_KEYS.CASH_CUTS);
    if (storedCashCuts) {
      try {
        const parsedCashCuts = JSON.parse(storedCashCuts);
        setCashCuts(Array.isArray(parsedCashCuts) ? parsedCashCuts : []);
      } catch (e) {
        localStorage.removeItem(STORAGE_KEYS.CASH_CUTS);
      }
    }

    setLoading(false);
  }, []);

  /**
   * Inicializa las cuentas de prueba iniciales (Admin y Cajero)
   */
  const seedUsers = () => {
    const defaultUsers = [
      {
        id: 'USR-01',
        nombre: 'Gerente General',
        email: 'admin@kfc.sv',
        password: '123',
        rol: ROLES.ADMIN,
        activo: true,
        creadoEn: new Date().toISOString()
      },
      {
        id: 'USR-02',
        nombre: 'Cajero Principal',
        email: 'cajero@kfc.sv',
        password: '456',
        rol: ROLES.CAJERO,
        activo: true,
        creadoEn: new Date().toISOString()
      }
    ];

    const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!storedUsers) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
      return;
    }

    let users;
    try {
      users = JSON.parse(storedUsers);
    } catch (error) {
      console.error('No se pudieron actualizar las cuentas de demostración guardadas.', error);
      return;
    }

    if (!Array.isArray(users)) {
      console.error('No se pudieron actualizar las cuentas de demostración: los datos guardados no son una lista.');
      return;
    }

    const demoPasswords = new Map(defaultUsers.map(({ email, password }) => [email, password]));
    let changed = false;
    const updatedUsers = users.map(existingUser => {
      const password = demoPasswords.get(existingUser?.email?.toLowerCase());
      if (password && existingUser.password !== password) {
        changed = true;
        return { ...existingUser, password };
      }
      return existingUser;
    });

    if (changed) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    }
  };

  /**
   * Obtiene la lista de usuarios registrados
   */
  const getUsers = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    } catch (e) {
      return [];
    }
  };

  /**
   * Guarda usuarios en localStorage
   */
  const saveUsers = (usersList) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));
  };

  /**
   * Inicia sesión validando credenciales y guardando timestamp
   */
  const login = (email, password) => {
    if (!email || !email.trim()) {
      return { success: false, message: 'El correo electrónico es obligatorio.' };
    }
    if (!isValidEmail(email)) {
      return { success: false, message: 'Ingresa un correo electrónico válido.' };
    }
    if (!password || !password.trim()) {
      return { success: false, message: 'La contraseña es obligatoria.' };
    }

    const users = getUsers();
    const foundUser = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!foundUser) {
      return { success: false, message: 'No se encontró una cuenta con ese correo.' };
    }
    if (!foundUser.activo) {
      return { success: false, message: 'Esta cuenta ha sido desactivada.' };
    }
    if (foundUser.password !== password) {
      return { success: false, message: 'La contraseña es incorrecta.' };
    }

    const sessionData = {
      id: foundUser.id,
      nombre: foundUser.nombre,
      email: foundUser.email,
      rol: foundUser.rol,
      loginTimestamp: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
    setUser(sessionData);

    return { success: true, rol: foundUser.rol };
  };

  /**
   * Cierra sesión y limpia carrito
   */
  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    setUser(null);
    setCart({});
  };

  /**
   * Registra un nuevo usuario en localStorage
   */
  const registerUser = (userData) => {
    const { nombre, email, password, rol = ROLES.CAJERO, telefono, direccion, fechaNacimiento } = userData;

    if (!isValidPersonName(nombre)) {
      return { success: false, message: 'Ingresa un nombre válido de 2 a 60 caracteres.' };
    }
    if (!isValidEmail(email)) {
      return { success: false, message: 'Ingresa un correo electrónico válido.' };
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
      return { success: false, message: 'La contraseña debe tener entre 8 y 72 caracteres.' };
    }
    if (![ROLES.ADMIN, ROLES.CAJERO].includes(rol)) {
      return { success: false, message: 'El rol seleccionado no es válido.' };
    }

    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      return { success: false, message: 'Ya existe una cuenta con ese correo.' };
    }

    const nextNumber = users.reduce((max, existing) => {
      const match = /^USR-(\d+)$/.exec(existing?.id || '');
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0) + 1;

    const newUser = {
      id: 'USR-' + String(nextNumber).padStart(2, '0'),
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password,
      rol,
      telefono: telefono || '',
      direccion: direccion || '',
      fechaNacimiento: fechaNacimiento || '',
      activo: true,
      creadoEn: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    return { success: true, message: 'Cuenta creada exitosamente.' };
  };

  /**
   * Elimina un usuario (solo el administrador). Protege la cuenta en sesión
   * y evita dejar el sistema sin ningún administrador.
   */
  const deleteUser = (userId) => {
    if (user?.rol !== ROLES.ADMIN) {
      return { success: false, message: 'Solo un administrador puede eliminar usuarios.' };
    }

    const users = getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) {
      return { success: false, message: 'El usuario no existe.' };
    }
    if (target.id === user.id) {
      return { success: false, message: 'No puedes eliminar tu propia cuenta mientras tienes la sesión iniciada.' };
    }
    if (target.rol === ROLES.ADMIN && users.filter(u => u.rol === ROLES.ADMIN).length <= 1) {
      return { success: false, message: 'Debe existir al menos un administrador en el sistema.' };
    }

    saveUsers(users.filter(u => u.id !== userId));
    return { success: true, message: `La cuenta de ${target.nombre} fue eliminada.` };
  };

  /**
   * Controla las cantidades del carrito temporal
   */
  const updateQuantity = (productId, delta) => {
    setCart(prev => {
      const current = prev[productId] || 0;
      const updated = Math.max(0, current + delta);
      const clone = { ...prev };
      if (updated === 0) {
        delete clone[productId];
      } else {
        clone[productId] = updated;
      }
      return clone;
    });
  };

  const clearCart = () => setCart({});

  const updateProductStock = (productId, stock) => {
    if (!Number.isInteger(stock) || stock < 0) {
      return { success: false, message: 'La cantidad debe ser un número entero igual o mayor que cero.' };
    }

    const productExists = products.some(product => product.id === productId);
    if (!productExists) {
      return { success: false, message: 'Producto no encontrado.' };
    }

    const updatedProducts = products.map(product => (
      product.id === productId ? { ...product, stock } : product
    ));

    setProducts(updatedProducts);
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(updatedProducts));

    return { success: true, message: 'Inventario actualizado correctamente.' };
  };

  /**
   * CREATE: Crea un nuevo pedido, descuenta stock del menú y persiste en 'kfc_orders'
   */
  const createOrder = (paymentMethod = 'Efectivo', clienteNombre = null, paymentDetails = null) => {
    if (Object.keys(cart).length === 0) {
      return { success: false, message: 'Agrega al menos un producto antes de crear el pedido.' };
    }
    if (!['Efectivo', 'Tarjeta', 'Digital'].includes(paymentMethod)) {
      return { success: false, message: 'El método de pago seleccionado no es válido.' };
    }
    if (clienteNombre && !isValidPersonName(clienteNombre)) {
      return { success: false, message: 'Ingresa un nombre de cliente válido de 2 a 60 caracteres.' };
    }

    // Validar productos y stock (y calcular el total para validar el efectivo recibido)
    let totalPrevio = 0;
    for (const [pId, qty] of Object.entries(cart)) {
      const prd = products.find(p => p.id === pId);
      if (!prd) {
        return { success: false, message: 'Producto no encontrado.' };
      }
      if (prd.stock < qty) {
        return {
          success: false,
          message: `Stock insuficiente para ${prd.nombre}. Disponible: ${prd.stock}`
        };
      }
      if (!Number.isInteger(qty) || qty <= 0) {
        return { success: false, message: 'La cantidad de productos del pedido no es válida.' };
      }
      totalPrevio += prd.precio * qty;
    }

    // Efectivo: si se informa el monto recibido, debe cubrir el total
    const montoRecibido = paymentMethod === 'Efectivo' && paymentDetails?.montoRecibido != null
      ? String(paymentDetails.montoRecibido)
      : null;
    if (montoRecibido !== null && !isValidCashAmount(montoRecibido, totalPrevio)) {
      return { success: false, message: 'El monto recibido no es válido o no cubre el total del pedido.' };
    }

    // Descontar inventario
    const updatedProducts = products.map(prod => {
      const qtyInCart = cart[prod.id] || 0;
      if (qtyInCart > 0) {
        return { ...prod, stock: prod.stock - qtyInCart };
      }
      return prod;
    });

    setProducts(updatedProducts);
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(updatedProducts));

    // Preparar ítems y totales
    let totalBruto = 0;
    const items = Object.entries(cart).map(([pId, qty]) => {
      const prd = products.find(p => p.id === pId);
      const subtotalItem = prd.precio * qty;
      totalBruto += subtotalItem;
      return {
        id: prd.id,
        nombre: prd.nombre,
        precio: prd.precio,
        quantity: qty,
        subtotal: parseFloat(subtotalItem.toFixed(2))
      };
    });

    const total = parseFloat(totalBruto.toFixed(2));
    const subtotalSinIva = parseFloat((total / 1.13).toFixed(2));
    const iva = parseFloat((total - subtotalSinIva).toFixed(2));

    const newOrder = {
      id: 'PED-' + String(orders.length + 1).padStart(3, '0'),
      fecha: new Date().toISOString(),
      cliente: clienteNombre || user?.nombre || 'Cliente Mostrador',
      cajeroId: user?.id || 'USR-SISTEMA',
      cajeroNombre: user?.nombre || 'Cajero de Turno',
      items,
      subtotal: subtotalSinIva,
      iva,
      total,
      tipoPago: paymentMethod,
      estado: ESTADOS_PEDIDO.PENDIENTE
    };

    // Solo se guarda lo necesario del pago en efectivo; nunca datos de tarjeta
    if (montoRecibido !== null) {
      newOrder.montoRecibido = parseFloat(montoRecibido);
      newOrder.cambio = calculateChange(montoRecibido, total);
    }

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updatedOrders));
    clearCart();

    return { success: true, pedido: newOrder };
  };

  /**
   * UPDATE: Actualiza el estado de un pedido (pendiente -> en_preparacion -> listo -> entregado)
   */
  const updateOrderStatus = (orderId, newStatus) => {
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      return { success: false, message: 'Pedido no encontrado.' };
    }

    const order = orders[orderIndex];
    if (order.estado === ESTADOS_PEDIDO.CANCELADO) {
      return { success: false, message: 'No se puede modificar un pedido cancelado.' };
    }

    const updated = {
      ...order,
      estado: newStatus,
      ultimaActualizacion: new Date().toISOString()
    };

    const updatedOrders = [...orders];
    updatedOrders[orderIndex] = updated;

    setOrders(updatedOrders);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updatedOrders));

    return { success: true, message: `Pedido ${orderId} actualizado a ${newStatus}.` };
  };

  /**
   * DELETE / ANULAR: Cancela el pedido y restaura el stock reservado al catálogo
   */
  const cancelOrder = (orderId) => {
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      return { success: false, message: 'Pedido no encontrado.' };
    }

    const order = orders[orderIndex];
    if (order.estado === ESTADOS_PEDIDO.CANCELADO) {
      return { success: false, message: 'El pedido ya está cancelado.' };
    }

    if (order.estado === ESTADOS_PEDIDO.ENTREGADO) {
      return { success: false, message: 'No se puede cancelar un pedido ya entregado.' };
    }

    // Restaurar inventario
    const updatedProducts = products.map(prod => {
      const itemEnPedido = order.items.find(it => it.id === prod.id);
      if (itemEnPedido) {
        return { ...prod, stock: prod.stock + itemEnPedido.quantity };
      }
      return prod;
    });

    setProducts(updatedProducts);
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(updatedProducts));

    // Cambiar estado a cancelado
    const updated = {
      ...order,
      estado: ESTADOS_PEDIDO.CANCELADO,
      fechaCancelacion: new Date().toISOString()
    };

    const updatedOrders = [...orders];
    updatedOrders[orderIndex] = updated;

    setOrders(updatedOrders);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updatedOrders));

    return { success: true, message: `Pedido ${orderId} cancelado y stock reincorporado.` };
  };

  /**
   * Retorna métricas en tiempo real para los dashboards
   */
  const calculateMetrics = () => {
    const hoyStr = new Date().toISOString().slice(0, 10);
    // Los cortes solo delimitan el resumen operativo del cajero.
    // El administrador conserva métricas globales e históricas completas.
    const ultimoCorte = user?.rol === ROLES.CAJERO && cashCuts.length > 0
      ? cashCuts[cashCuts.length - 1].at
      : null;
    const pedidosHoy = orders.filter(o => {
      if (!o.fecha) return false;
      return ultimoCorte ? o.fecha > ultimoCorte : o.fecha.startsWith(hoyStr);
    });

    const ventasDelDia = pedidosHoy
      .filter(o => o.estado !== ESTADOS_PEDIDO.CANCELADO)
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const pedidosPendientes = orders.filter(
      o => o.estado === ESTADOS_PEDIDO.PENDIENTE || o.estado === ESTADOS_PEDIDO.EN_PREPARACION
    ).length;

    const ventasGlobales = orders
      .filter(o => o.estado !== ESTADOS_PEDIDO.CANCELADO)
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const productosCriticos = products.filter(p => p.stock < 5);

    return {
      pedidosHoyCount: pedidosHoy.length,
      ventasDelDiaTotal: ventasDelDia,
      pedidosPendientesCount: pedidosPendientes,
      ventasGlobalesTotal: ventasGlobales,
      productosCriticosCount: productosCriticos.length,
      productosCriticos
    };
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      registerUser,
      deleteUser,
      getUsers,
      ROLES,
      products,
      cart,
      updateQuantity,
      clearCart,
      updateProductStock,
      createOrder,
      updateOrderStatus,
      cancelOrder,
      orders,
      calculateMetrics,
      cashCuts,
      makeCashCut: () => {
        const lastCutAt = cashCuts.length > 0 ? cashCuts[cashCuts.length - 1].at : null;
        const closedOrders = orders.filter(order => {
          if (!order?.fecha || order.estado === ESTADOS_PEDIDO.CANCELADO) return false;
          return lastCutAt ? order.fecha > lastCutAt : order.fecha.slice(0, 10) === new Date().toISOString().slice(0, 10);
        });
        const efectivo = closedOrders
          .filter(order => order.tipoPago === 'Efectivo')
          .reduce((sum, order) => sum + Number(order.total || 0), 0);
        const tarjeta = closedOrders
          .filter(order => order.tipoPago === 'Tarjeta' || order.tipoPago === 'Digital')
          .reduce((sum, order) => sum + Number(order.total || 0), 0);
        const newCut = {
          id: `CORTE-${Date.now()}`,
          at: new Date().toISOString(),
          cajeroId: user?.id || 'USR-SISTEMA',
          cajeroNombre: user?.nombre || 'Cajero de turno',
          pedidos: closedOrders.length,
          efectivo: Number(efectivo.toFixed(2)),
          tarjeta: Number(tarjeta.toFixed(2)),
          total: Number((efectivo + tarjeta).toFixed(2)),
          remesa: Number(efectivo.toFixed(2))
        };
        const updatedCuts = [...cashCuts, newCut];
        setCashCuts(updatedCuts);
        localStorage.setItem(STORAGE_KEYS.CASH_CUTS, JSON.stringify(updatedCuts));
        return { success: true, corte: newCut };
      },
      revertCashCut: () => {
        if (cashCuts.length === 0) {
          return { success: false, message: 'No existe un corte para revertir.' };
        }
        const updatedCuts = cashCuts.slice(0, -1);
        setCashCuts(updatedCuts);
        localStorage.setItem(STORAGE_KEYS.CASH_CUTS, JSON.stringify(updatedCuts));
        return { success: true };
      },
      ESTADOS_PEDIDO
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
