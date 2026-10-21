import { createContext, useContext, useState, useEffect } from 'react';
import {
  STORAGE_KEYS,
  ESTADOS_PEDIDO,
  INITIAL_MENU,
  INITIAL_ORDERS,
  isValidEmail,
  isValidPersonName
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
        setProducts(JSON.parse(storedMenu));
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
   * Genera un ID único para nuevos productos.
   */
  const generateProductId = (nextProducts = products) => {
    const numbers = nextProducts
      .map(product => Number(String(product?.id || '').replace(/\D/g, '')))
      .filter(value => Number.isInteger(value) && value > 0);

    const maxValue = numbers.length ? Math.max(...numbers) : 0;
    return `PRD-${String(maxValue + 1).padStart(2, '0')}`;
  };

  /**
   * Persistencia centralizada del catálogo y la administración del inventario.
   */
  const saveProducts = (nextProducts) => {
    setProducts(nextProducts);
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(nextProducts));
  };

  /**
   * Agrega un producto nuevo al menú y al inventario del sistema.
   */
  const addProduct = (productData) => {
    const trimmedName = String(productData?.nombre || '').trim();
    const trimmedDescription = String(productData?.descripcion || '').trim();
    const category = String(productData?.categoria || '').trim();
    const img = String(productData?.img || '').trim();
    const price = Number(productData?.precio);
    const stock = Number(productData?.stock);

    if (!trimmedName || !category) {
      return { success: false, message: 'El nombre y la categoría del producto son obligatorios.' };
    }
    if (!Number.isFinite(price) || price <= 0) {
      return { success: false, message: 'El precio debe ser mayor que cero.' };
    }
    if (!Number.isInteger(stock) || stock < 0) {
      return { success: false, message: 'El stock debe ser un número entero mayor o igual a cero.' };
    }

    const nextProduct = {
      id: productData?.id || generateProductId(),
      categoria: category,
      nombre: trimmedName,
      precio: Number(price.toFixed(2)),
      stock: Number(stock),
      img: img || 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80',
      descripcion: trimmedDescription || 'Producto disponible en el menú.'
    };

    const nextProducts = [...products, nextProduct];
    saveProducts(nextProducts);
    return { success: true, product: nextProduct };
  };

  /**
   * Actualiza la información de un producto existente y vuelve a persistir el inventario.
   */
  const updateProduct = (productId, productData) => {
    const productIndex = products.findIndex(product => product.id === productId);
    if (productIndex === -1) {
      return { success: false, message: 'No se encontró el producto a editar.' };
    }

    const nextProduct = {
      ...products[productIndex],
      categoria: String(productData?.categoria || products[productIndex].categoria).trim(),
      nombre: String(productData?.nombre || '').trim() || products[productIndex].nombre,
      precio: Number(productData?.precio ?? products[productIndex].precio),
      stock: Number(productData?.stock ?? products[productIndex].stock),
      descripcion: String(productData?.descripcion || '').trim() || products[productIndex].descripcion,
      img: String(productData?.img || products[productIndex].img).trim() || products[productIndex].img
    };

    if (!nextProduct.nombre || !nextProduct.categoria) {
      return { success: false, message: 'El nombre y la categoría del producto son obligatorios.' };
    }
    if (!Number.isFinite(nextProduct.precio) || nextProduct.precio <= 0) {
      return { success: false, message: 'El precio debe ser mayor que cero.' };
    }
    if (!Number.isInteger(nextProduct.stock) || nextProduct.stock < 0) {
      return { success: false, message: 'El stock debe ser un número entero mayor o igual a cero.' };
    }

    const nextProducts = products.map(product => product.id === productId ? nextProduct : product);
    saveProducts(nextProducts);
    return { success: true, product: nextProduct };
  };

  /**
   * Elimina un producto del menú y del inventario del sistema.
   */
  const deleteProduct = (productId) => {
    const productToDelete = products.find(product => product.id === productId);
    if (!productToDelete) {
      return { success: false, message: 'No se encontró el producto.' };
    }

    const nextProducts = products.filter(product => product.id !== productId);
    saveProducts(nextProducts);
    return { success: true, product: productToDelete };
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

    const newUser = {
      id: 'USR-' + String(users.length + 1).padStart(2, '0'),
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

  /**
   * CREATE: Crea un nuevo pedido, descuenta stock del menú y persiste en 'kfc_orders'
   */
  const createOrder = (paymentMethod = 'Efectivo', clienteNombre = null) => {
    if (Object.keys(cart).length === 0) {
      return { success: false, message: 'Agrega al menos un producto antes de crear el pedido.' };
    }
    if (!['Efectivo', 'Tarjeta', 'Digital'].includes(paymentMethod)) {
      return { success: false, message: 'El método de pago seleccionado no es válido.' };
    }
    if (clienteNombre && !isValidPersonName(clienteNombre)) {
      return { success: false, message: 'Ingresa un nombre de cliente válido de 2 a 60 caracteres.' };
    }

    // Validar productos y stock
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
    const pedidosHoy = orders.filter(o => o.fecha && o.fecha.startsWith(hoyStr));

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
      getUsers,
      ROLES,
      products,
      cart,
      updateQuantity,
      clearCart,
      createOrder,
      updateOrderStatus,
      cancelOrder,
      orders,
      calculateMetrics,
      ESTADOS_PEDIDO,
      addProduct,
      updateProduct,
      deleteProduct
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

