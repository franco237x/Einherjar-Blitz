// Newest first. Shared by /noticias and the landing's latest-news block.
export type NewsType = 'Anuncio' | 'Actualización' | 'Parche' | 'Evento';

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  type: NewsType;
  content: string;
}

export const NEWS: NewsItem[] = [
  {
    id: 'jardin-yggdrasil',
    title: 'Nuevo evento: el Jardín de Yggdrasil',
    date: '2 de Octubre, 2026',
    type: 'Evento',
    content:
      'Los zombis avanzan sobre el jardín del árbol del mundo. Elige hasta 6 plantas antes de cada nivel y defiende los cinco carriles. Hay 5 niveles y cada uno paga más que el anterior: 250, 500, 750, 1000 y 1500 monedas, hasta 4000 en total. Once plantas para elegir, entre ellas Cilantro, Limón y Jengibrón, y cinco zombis, como el veloz Ráfago y el gigante Brutón. Cada nivel se cobra una sola vez. El almanaque explica cada planta y cada zombi, y puedes retirar tus monedas en un vale para canjear con los administradores.',
  },
  {
    id: 'portal-animado',
    title: 'El portal se mueve: inicio, tienda e invocaciones renovados',
    date: '30 de Septiembre, 2026',
    type: 'Actualización',
    content:
      'Renovamos las pantallas del portal con animaciones nuevas. El inicio presenta a tu guerrero con su experiencia y estadísticas en vivo, la tesorería muestra cómo cambian tus llaves y esferas, y la conversión tiene su propia celebración. La tienda estrena tarjetas con brillo, filtros fluidos y una compra más clara. En las invocaciones, cada banner tiene vida propia y la ceremonia reparte las cartas y las revela según su rareza.',
  },
  {
    id: 'rumbo-al-rpg',
    title: 'Rumbo al RPG: Einherjar Blitz crece',
    date: '30 de Septiembre, 2026',
    type: 'Anuncio',
    content:
      'Einherjar Blitz se convierte en un RPG de colección. Estamos preparando combates por equipos de tres, una forja para fusionar guerreros, salones que producen esferas y una arena contra los equipos de otros jugadores. El modo combate sigue cerrado hasta que el combate por equipos esté listo.',
  },
  {
    id: 'cierre-huerto',
    title: 'Terminó El Huerto de Yggdrasil',
    date: '30 de Septiembre, 2026',
    type: 'Evento',
    content:
      'Gracias por participar del evento Agro. En la página del evento puedes ver tus logros, descargar tus vales y emitir un último vale con las monedas que cosechaste.',
  },
  {
    id: 'invocaciones-servidor',
    title: 'Invocaciones verificadas en el servidor',
    date: '30 de Septiembre, 2026',
    type: 'Actualización',
    content:
      'Las invocaciones ahora se tiran en el servidor, que cobra, registra el resultado y entrega las recompensas en una sola operación. Si una invocación se repite por un corte de conexión, no se cobra dos veces.',
  },
  {
    id: 'banner-voluntad',
    title: 'Nuevo banner: Voluntad Indomable',
    date: '29 de Septiembre, 2026',
    type: 'Actualización',
    content:
      'Llega un segundo banner de invocaciones con poderes, invocaciones y reliquias. Cada tirada cuesta una llave, igual que en el banner de Persona, y sus probabilidades están publicadas en la pantalla del gacha.',
  },
  {
    id: 'historial-0',
    title: 'Actualización v1.1.7 - Una nueva base para Einherjar Blitz',
    date: '24 de Julio, 2026',
    type: 'Actualización',
    content:
      'Renovamos la experiencia visual de la aplicación, desde el acceso y la navegación hasta el perfil, la tienda y el sistema de invocaciones. El gacha ahora cuenta con una ceremonia más cuidada, resultados claros, probabilidades e inventario integrado. También reforzamos la economía, las compras, las recompensas, las transferencias y la búsqueda de jugadores para lograr una sincronización más confiable. El modo combate permanece temporalmente cerrado mientras completamos la arena, las animaciones y el balance del primer enfrentamiento.',
  },
  {
    id: 'historial-1',
    title: 'Actualización v1.1.3 - Foto de Perfil, Transferencias y Conversión',
    date: '26 de Junio, 2026',
    type: 'Parche',
    content:
      'Gran actualización de funcionalidades. Ahora puedes personalizar tu foto de perfil subiendo una imagen desde tu galería. Implementamos el sistema de transferencia de llaves entre jugadores por email. Agregamos la conversión de llaves a esferas (1 llave = 50 esferas). También mejoramos el sistema de reclamo de recompensas: los archivos PDF y TXT ahora se guardan directamente en tu dispositivo, y sincronizamos en tiempo real las llaves y esferas entre todas las pestañas de la app.',
  },
  {
    id: 'historial-2',
    title: 'Panel de Administración Remota',
    date: '26 de Junio, 2026',
    type: 'Anuncio',
    content:
      'Hemos implementado un panel web de administración que nos permite gestionar las llaves y esferas de los jugadores de forma remota. Esto nos ayuda a dar soporte rápido a la comunidad y realizar ajustes de balance sin necesidad de actualizar la app.',
  },
  {
    id: 'historial-3',
    title: '¡Lanzamiento Oficial de Einherjar Blitz!',
    date: '25 de Junio, 2026',
    type: 'Anuncio',
    content:
      'Es oficial. Después de meses de desarrollo, Einherjar Blitz por fin ha visto la luz del día. Ya puedes descargar el APK e iniciar tu aventura épica. Domina el gacha, forma tu equipo táctico y conquista la arena. ¡Nos vemos en el campo de batalla!',
  },
  {
    id: 'historial-4',
    title: 'Actualización v1.1.2 - Mejoras en Interfaz y Recompensas',
    date: '25 de Junio, 2026',
    type: 'Parche',
    content:
      'Hemos solucionado diversos problemas de diseño en la pantalla de inventario. Ahora, el botón de \'Reclamar\' en el sistema de gacha siempre es visible y respeta el flujo de la pantalla en cualquier resolución de móvil. Además, pulimos las \'Safe Areas\' para que no haya solapamientos.',
  },
  {
    id: 'historial-5',
    title: 'Actualización v1.1.0 - Autenticación Nativa con Google',
    date: 'Reciente',
    type: 'Parche',
    content:
      'Se integró completamente el inicio de sesión nativo con Google OAuth, mejorando la seguridad y fluidez del acceso. También agregamos el \'Immersive Mode\' para una experiencia a pantalla completa ininterrumpida y se corrigieron bugs menores en el formulario de registro y la Firebase Config.',
  },
];
