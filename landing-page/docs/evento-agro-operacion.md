# El Huerto de Yggdrasil: operación

## Estado y rutas

- Juego: `/evento/agro`.
- Álbum con progreso y premios: `/evento/agro/album`.
- Consulta y registro administrativo de canjes: `/evento/agro/canje`.
- Guía lista para compartir: `public/evento-agro/guia-del-grupo.txt`.

Las 15 ilustraciones ya participan en invocaciones, siembra y fusiones. Los estados del álbum son desconocida, descubierta, cultivada y maestría. Los premios de 3/6/9/12/15 especies se recogen una sola vez. Los sellos y fondos son decorativos. Las reglas exactas de producción, probabilidades y garantías están centralizadas en `src/lib/agroGame.ts` y descritas en la guía pública.

## Ejecutar en esta computadora

`npm run dev -- -p 3101` usa almacenamiento en `landing-page/.agro-data/store.json`. Ese directorio está ignorado por Git. Se conserva al reiniciar el servidor. Todas las lecturas y escrituras locales comparten un bloqueo de archivo y las actualizaciones reemplazan el archivo de forma atómica. Está pensado para desarrollo, con un único servidor, no para funciones de Vercel.

Los vales locales llevan la leyenda de demostración y no son canjeables en el evento. La primera solicitud de canje administrativo crea una clave aleatoria en `.agro-data/admin-key.txt` si no se definió `AGRO_ADMIN_KEY`. No compartir esta clave ni ese directorio. Para obtener una clave local antes de abrir el panel puede configurarse directamente `AGRO_ADMIN_KEY` en `.env.local` (mínimo 32 caracteres aleatorios).

Si el proceso se interrumpe mientras mantiene el bloqueo, detener todos los servidores del evento y retirar únicamente `.agro-data/store.lock` antes de reiniciar. No eliminar `store.json`. Hacer copias de respaldo del directorio antes de cambios de infraestructura.

## Activar en Vercel / producción

La configuración pública de Firebase que ya usa `/juego` no concede acceso al servidor. Se necesita completar lo siguiente antes de anunciar el evento:

1. Crear una base Firestore **separada y con nombre**, por ejemplo `agro`. El código rechaza la base `(default)` para no mezclar el evento con las reglas del juego anterior.
2. Aplicar `firestore.agro.rules` en esa base: ningún cliente puede leer o escribir directamente. `firebase.agro.json` describe solo esa base. Si se utiliza otro nombre, actualizar el archivo y la variable de entorno juntos. No desplegar reglas del proyecto viejo sobre esta base.
3. Otorgar a una cuenta de servicio acceso IAM a esa base e introducir su JSON como secreto `AGRO_FIREBASE_SERVICE_ACCOUNT_JSON`, o usar `GOOGLE_APPLICATION_CREDENTIALS` en un servidor propio. Nunca usar prefijos `NEXT_PUBLIC_` para credenciales administrativas.
4. Configurar `AGRO_STORE=firestore`, `AGRO_FIREBASE_PROJECT_ID`, `AGRO_FIRESTORE_DATABASE_ID=agro`, `AGRO_ADMIN_KEY` (secreto aleatorio de al menos 32 caracteres) y `AGRO_PUBLIC_URL` (origen HTTPS público sin barra final).
5. Publicar la versión y comprobar el recorrido completo con saldo real de juego: guardar, emitir, descargar, consultar y registrar un canje. Guardar la clave administrativa en un gestor de contraseñas y dar acceso solo a quienes acrediten monedas.

Sin la base privada y las credenciales, la API pública de la partida responde 503. Sin una clave administrativa válida, la emisión de vales públicos también queda bloqueada y el jugador conserva su saldo. No hay una alternativa de saldo controlado por el navegador en producción. No se ha desplegado ni configurado una cuenta de servicio desde esta tarea.

Referencias: [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup), [transacciones de Firestore](https://firebase.google.com/docs/firestore/manage-data/transactions), [seguridad de clientes y servidores](https://firebase.google.com/docs/firestore/security/overview).

## Integridad del saldo y del canje

El navegador envía acciones, una revisión y un identificador de petición. La API determina tiempo, azar, inventario y saldo. Una transacción guarda partida y vale juntos, reserva el saldo completo y conserva un recibo para reintentos. Una revisión evita gastar dos veces desde pestañas desactualizadas. Los últimos 40 recibos se conservan; peticiones más antiguas quedan rechazadas por su revisión.

El PDF acepta únicamente un folio existente. No acepta nombre, importe ni fechas como autoridad. El folio contiene 96 bits aleatorios y su enlace permite consultar el registro actual. El PDF por sí solo no sustituye esa consulta: puede copiarse o editarse, por lo que el administrador debe utilizar los datos guardados. Una segunda acreditación del mismo folio se rechaza transaccionalmente.

La clave de administración se envía en cabecera y no se guarda en el navegador. El panel marca el folio como canjeado **antes** de que el administrador acredite manualmente las monedas en el grupo. Si falla la conexión al confirmar, consultar otra vez el folio antes de actuar. Si se marcó canjeado pero falta acreditar, completar la acreditación manual y anotarla en el grupo. No repetirla.

## Identidad, privacidad y progreso anterior

El evento utiliza una cookie de sesión aleatoria, HttpOnly y SameSite=Strict, válida un año y renovada al abrir el huerto; Secure en HTTPS. No comparte identidad con el juego antiguo ni comprueba una cuenta de Messenger. Cada navegador tiene su huerto; el administrador debe contrastar el nombre del vale con el miembro que lo presenta. Borrar cookies o utilizar otro navegador crea una partida diferente. No hay recuperación de cuenta ni protección contra múltiples navegadores: si se exige una única partida por persona, se necesita incorporar un registro de miembros antes del evento.

Quien tenga un folio puede consultar su nombre declarado, importe y estado; no publicar folios fuera del grupo. No se expone un listado de jugadores o vales.

Las partidas del prototipo `einherjar-agro-v1` se conservan intactas en localStorage como respaldo. Sus saldos, PDF y semillas estaban controlados por el cliente y **no se importan al registro verificado**. El nuevo evento inicia con una semilla común por linaje y 5 polen. Esto evita convertir saldos editables del prototipo en monedas válidas. Si hubiera jugadores de una prueba anterior, resolver cualquier compensación manualmente antes de abrir el evento.

## Economía

El canje es una acreditación manual en el grupo, no un pago automático ni dinero real. Se mantiene el importe nominal del vale; los premios o usos de esas monedas los establece la administración. No se definieron compras, caducidad, fecha de cierre ni tope diario. Ajustar las reglas y el texto público juntos si la administración decide añadirlos.
