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
| jsPDF | Generación del reporte formal de corte de caja en PDF. | Permite descargar un comprobante legible con el resumen del cierre, fondo y remesa. |

## Módulos funcionales

- **Inicio de sesión y roles:** acceso diferenciado para administración y caja; las rutas restringidas requieren una sesión.
- **Panel administrativo:** resumen de ventas, pedidos y alertas de stock; acceso a inventario, reportes, pedidos y usuarios.
- **Inventario:** consulta de productos por categoría y visualización de existencias y alertas de stock crítico.
- **Reportes:** métricas de ventas y pedidos; gráfica de ventas diarias del mes seleccionado y descarga de los valores diarios en CSV.
- **Panel de cajero:** catálogo por categorías, carrito, creación de pedidos, actualización del estado y consulta de pedidos.
- **Vista de pedido:** resumen de productos, cantidades, totales y selección de pago en efectivo o pago con tarjeta simulado.
- **Corte de caja:** resumen de ventas posteriores al último corte, separado por efectivo y tarjeta, con fondo fijo de `$160.00`, efectivo esperado y remesa.
- **Reporte de corte:** descarga de un PDF formal con fecha, cajero, ventas, control de efectivo, remesa y espacios para firmas.
- **Reversión de corte:** permite revertir el último corte confirmado sin eliminar pedidos del historial.
- **Cierres administrativos:** consulta mensual de cierres con fecha, hora, cajero, pedidos, efectivo, tarjeta, total y remesa.
- **Clima:** consulta del clima actual de San Salvador mediante Open-Meteo y mapa de referencia con OpenStreetMap.

Los datos iniciales son datos de demostración. La aplicación guarda cambios en el almacenamiento local del navegador; por ello, no se sincronizan entre dispositivos ni representan una base de datos compartida. Los cortes también se guardan localmente y no modifican el historial ni la gráfica mensual del administrador.

## Flujo de corte de caja

1. Inicia sesión con una cuenta de cajero.
2. Accede a **Corte de caja** desde el encabezado.
3. Revisa efectivo, tarjeta, total, fondo inicial y remesa.
4. Selecciona **Descargar PDF** para generar el reporte formal.
5. Selecciona **Hacer corte** y confirma la operación.
6. El resumen comienza nuevamente en `$0.00`; el fondo de `$160.00` permanece en caja.
7. Las ventas posteriores se acumulan para el siguiente corte.
8. **Revertir corte** restaura el resumen anterior si fue necesario.

El administrador consulta los cierres desde **Cierres** o desde la tarjeta **Cierres de caja**. La gráfica mensual conserva todas las ventas válidas, independientemente de los cortes realizados.

## Validaciones implementadas

- Correo: se comprueba que tenga una estructura de dirección de correo antes de iniciar sesión.
- Nombre de cliente: se validan entre 2 y 60 caracteres; se permiten letras Unicode, espacios, apóstrofes y guiones.
- Pedido: el sistema comprueba que haya productos, que las cantidades sean enteros positivos, que los productos existan y que haya stock suficiente. También valida el método de pago permitido.
- Pago con tarjeta simulado: valida nombre, longitud y dígito de control del número de tarjeta (algoritmo de Luhn), mes y año de vencimiento no vencidos y CVV de 3 o 4 dígitos. No procesa pagos reales.
- Registro de usuario del servicio: valida nombre, correo, longitud de contraseña y rol, además de impedir correos duplicados.
- Corte de caja: solicita confirmación antes de cerrar las ventas y antes de revertir el último corte.
- API externa: informa errores de conexión o respuestas incompletas de la API meteorológica.

Estas comprobaciones se ejecutan en el frontend y no sustituyen validaciones de servidor. La aplicación es una demostración educativa y no debe usarse para procesar información real.

## Credenciales de demostración

- Administración: `admin@kfc.sv`
- Contraseña de administración: `123`
- Cajero: `cajero@kfc.sv`
- Contraseña de cajero: `456`

Las credenciales son públicas, de demostración y se almacenan en el navegador. Las contraseñas son deliberadamente simples para facilitar la evaluación; no reutilices contraseñas reales ni uses estas cuentas en un sistema de producción.

## Enlace publicado

[https://appkfc.vercel.app/login]

## Enlace de video 
[https://1drv.ms/v/c/f279e39f203ef0af/IQCELoxRUfVTQrZuc9vRX_0iAX4JWANALjeQQy5m2AtkWGs?e=7ijgUH ]

## Estructura principal

```text
src/
  components/   Componentes reutilizables, gráfico de ventas y panel meteorológico
  context/      Estado compartido de autenticación, menú y pedidos
  pages/        Vistas de administración, caja, cortes, clima, inicio de sesión y pedidos
  services/     Persistencia local, datos iniciales, validadores y API meteorológica
  App.jsx       Rutas principales de la aplicación
```

## Rutas principales

| Ruta | Acceso | Función |
| --- | --- | --- |
| `/login` | Público | Inicio de sesión |
| `/admin` | Administrador | Panel, inventario, usuarios, pedidos y reportes |
| `/admin/cierres-caja` | Administrador | Consulta mensual de cierres de caja |
| `/cajero` | Cajero | Menú, carrito y gestión de pedidos |
| `/corte-caja` | Cajero | Corte, PDF y reversión del último corte |
| `/orden` | Cajero | Confirmación y cobro del pedido |
| `/clima` | Administrador y cajero | Clima actual y mapa de referencia |
