# Sistema web de gestión operativa KFC

Aplicación web frontend para apoyar la operación de un comercio KFC. Incluye flujos de caja y pedidos, control de inventario, gestión de usuarios y reportes de ventas. El proyecto está desarrollado con React y Vite; no es una entrega de HTML/CSS/JavaScript sin framework.

## Integrantes

- Keisy Minely Portillo Colocho — PC171198
- Pablo Ernesto Vanegas Gámez — EV232903
- Josué Amilcar Castro Osorio — CO251195

## Requisitos

- Node.js 20.19+ o 22.12+.
- npm.

## Instalación y ejecución

Desde la carpeta del proyecto:

```bash
npm install
npm run dev
```

Vite mostrará en la terminal la dirección local para abrir la aplicación. Para generar y revisar la versión de producción:

```bash
npm run build
npm run preview
```

El proyecto también define `npm run lint` para ejecutar Oxlint.

## Tecnologías y decisiones

| Tecnología o librería | Uso en el proyecto | Motivo |
| --- | --- | --- |
| React 19 | Construcción de la interfaz mediante componentes y estado compartido en `AuthContext`. | Permite mantener sincronizados los módulos cuando cambian los pedidos, el carrito o el inventario. |
| Vite 8 | Servidor de desarrollo y compilación de producción. | Ofrece un flujo de desarrollo y empaquetado adecuado para una aplicación frontend moderna. |
| React Router | Navegación entre inicio de sesión, panel de administración, panel de cajero y vista de pedido. | Separa las vistas en rutas y permite protegerlas según el rol. |
| Bootstrap 5 | Sistema de grillas, formularios, tablas, botones y utilidades de diseño adaptable. | Acelera la creación de una interfaz consistente y adaptable a distintos tamaños de pantalla. |
| Bootstrap Icons | Iconografía de acciones, estados y módulos. | Mantiene un estilo visual uniforme con los componentes de Bootstrap. |
| Chart.js | Gráfica de ventas diarias por día del mes, en `src/components/MonthlySalesChart.jsx`. | Permite visualizar los importes de manera interactiva y actualizarlos según el mes seleccionado. |
| SweetAlert2 | Confirmación y notificación al exportar el reporte CSV. | Presenta diálogos más claros que las alertas nativas del navegador para ese flujo. |
| CSS | Estilos propios de la marca, componentes y ajustes adaptables, en `src/App.css` y `src/index.css`. | Complementa Bootstrap con la identidad visual y el diseño específico del sistema. |
| `localStorage` | Persistencia local de usuarios de demostración, sesión, menú y pedidos. | Permite probar los flujos sin configurar un servidor o base de datos. |

## Módulos funcionales

- **Inicio de sesión y roles:** acceso diferenciado para administración y caja; las rutas restringidas requieren una sesión.
- **Panel administrativo:** resumen de ventas, pedidos y alertas de stock; acceso a inventario, reportes, pedidos y usuarios.
- **Inventario:** consulta de productos por categoría y visualización de existencias y alertas de stock crítico.
- **Reportes:** métricas de ventas y pedidos; gráfica de ventas diarias del mes seleccionado y descarga de los valores diarios en CSV.
- **Panel de cajero:** catálogo por categorías, carrito, creación de pedidos, actualización del estado y consulta de pedidos.
- **Vista de pedido:** resumen de productos, cantidades, totales y selección de pago en efectivo o pago con tarjeta simulado.

Los datos iniciales son datos de demostración. La aplicación guarda cambios en el almacenamiento local del navegador; por ello, no se sincronizan entre dispositivos ni representan una base de datos compartida.

## Validaciones implementadas

- Correo: se comprueba que tenga una estructura de dirección de correo antes de iniciar sesión.
- Nombre de cliente: se validan entre 2 y 60 caracteres; se permiten letras Unicode, espacios, apóstrofes y guiones.
- Pedido: el sistema comprueba que haya productos, que las cantidades sean enteros positivos, que los productos existan y que haya stock suficiente. También valida el método de pago permitido.
- Pago con tarjeta simulado: valida nombre, longitud y dígito de control del número de tarjeta (algoritmo de Luhn), mes y año de vencimiento no vencidos y CVV de 3 o 4 dígitos. No procesa pagos reales.
- Registro de usuario del servicio: valida nombre, correo, longitud de contraseña y rol, además de impedir correos duplicados.

Estas comprobaciones se ejecutan en el frontend y no sustituyen validaciones de servidor. La aplicación es una demostración educativa y no debe usarse para procesar información real.

## Credenciales de demostración

- Administración: `admin@kfc.sv`
- Contraseña de administración: `123`
- Cajero: `cajero@kfc.sv`
- Contraseña de cajero: `456`

Las credenciales son públicas, de demostración y se almacenan en el navegador. Las contraseñas son deliberadamente simples para facilitar la evaluación; no reutilices contraseñas reales ni uses estas cuentas en un sistema de producción.

## Enlace publicado

[Abrir la aplicación]

## Estructura principal

```text
src/
  components/   Componentes reutilizables, incluido el gráfico de ventas
  context/      Estado compartido de autenticación, menú y pedidos
  pages/        Vistas de administración, caja, inicio de sesión y pedidos
  services/     Persistencia local, datos iniciales y validadores
  App.jsx       Rutas principales de la aplicación
```
