# El Huerto de Yggdrasil: operación

## Evento cerrado (30 de septiembre de 2026)

- `/evento/agro` muestra el agradecimiento y los logros de la cuenta: monedas cosechadas, especies, invocaciones, sellos, premios del herbario y vales.
- `/evento/agro/album` redirige a `/evento/agro`.
- `GET /api/agro/partida` solo lee (`readFarm`): no crea, vincula ni migra huertos. `POST` solo acepta la acción `voucher`, para que cada jugador convierta su saldo cosechado en un último vale (con el mismo límite de 2.000 monedas por día); cualquier otra acción responde 410.
- Los vales ya emitidos siguen funcionando: `/api/agro/vale` descarga el PDF y `/evento/agro/canje` sirve para consultar y canjear.
- Las monedas que siguen en las plantas sin cosechar no cuentan: la cosecha está cerrada.
- El motor del evento (`src/lib/agroGame.ts`, `performAction` y `loadFarm` en `src/lib/agroServer.ts`) se conserva. Para reabrirlo hay que restaurar la interfaz desde el historial de Git.

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

## Configuración de producción

El evento usa el proyecto Firebase `einherjar-agro-7578c` para su base privada, separado del juego anterior. El inicio de sesión sigue usando el proyecto existente `einherjer-blitz-7578c`. La base Firestore del evento se llama `agro`, está en `southamerica-east1`, tiene protección contra borrado y conserva la cuota gratuita. Las reglas de `firestore.agro.rules` ya están publicadas para esa base y bloquean el acceso directo de clientes. La cuenta `agro-game-server@einherjar-agro-7578c.iam.gserviceaccount.com` tiene el rol `roles/datastore.user` en ese proyecto.

Vercel tiene las variables de producción `AGRO_STORE`, `AGRO_FIREBASE_PROJECT_ID`, `AGRO_FIRESTORE_DATABASE_ID`, `AGRO_FIREBASE_SERVICE_ACCOUNT_JSON`, `AGRO_ADMIN_KEY` y `AGRO_PUBLIC_URL`. Los secretos `AGRO_ADMIN_KEY` y `AGRO_FIREBASE_SERVICE_ACCOUNT_JSON` no deben copiarse al repositorio. La clave administrativa se guardó en el perfil local del propietario, fuera de `htdocs`: `C:\Users\gg454\.codex\secrets\einherjar-agro-admin-key.txt`.

## Reproducir o reparar la configuración

La configuración pública de Firebase que usa `/juego` identifica el proyecto de Authentication para verificar tokens, pero no concede acceso a la base privada del evento. Si hay que reproducir esta instalación, seguir estos pasos:

1. Usar el proyecto Firebase `einherjar-agro-7578c` y su base Firestore **separada y con nombre** `agro`. El código rechaza la base `(default)` para no mezclar el evento con las reglas del juego anterior.
2. Aplicar `firestore.agro.rules` en esa base: ningún cliente puede leer o escribir directamente. `firebase.agro.json` describe solo esa base. Si se utiliza otro nombre, actualizar el archivo y la variable de entorno juntos. No desplegar reglas del proyecto viejo sobre esta base.
3. Otorgar a la cuenta de servicio `roles/datastore.user` en el proyecto del evento e introducir su JSON como secreto `AGRO_FIREBASE_SERVICE_ACCOUNT_JSON`, o usar `GOOGLE_APPLICATION_CREDENTIALS` en un servidor propio. Nunca usar prefijos `NEXT_PUBLIC_` para credenciales administrativas.
4. Configurar `AGRO_STORE=firestore`, `AGRO_FIREBASE_PROJECT_ID`, `AGRO_FIRESTORE_DATABASE_ID=agro`, `AGRO_ADMIN_KEY` (secreto aleatorio de al menos 32 caracteres) y `AGRO_PUBLIC_URL` (origen HTTPS público sin barra final). Mantener `NEXT_PUBLIC_FIREBASE_PROJECT_ID` apuntando al proyecto del login existente, no al proyecto privado del huerto.
5. Publicar la versión y comprobar el recorrido completo con saldo real de juego: guardar, emitir, descargar, consultar y registrar un canje. Guardar la clave administrativa en un gestor de contraseñas y dar acceso solo a quienes acrediten monedas.

Sin la base privada y las credenciales, la API pública de la partida responde 503. Sin una clave administrativa válida, la emisión de vales públicos también queda bloqueada y el jugador conserva su saldo. No hay una alternativa de saldo controlado por el navegador en producción.

El 28 de septiembre de 2026 se comprobó en producción una partida, tres riegos, una cosecha, la emisión y descarga del PDF, la consulta del folio y el canje administrativo. El folio `AGRO-20260928-BCB2B0D109675964EC5CE27D`, a nombre de `Prueba de sistema` por 1 moneda, ya figura como canjeado. No acreditarlo en el grupo. Un segundo intento de canje devolvió HTTP 409.

Referencias: [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup), [transacciones de Firestore](https://firebase.google.com/docs/firestore/manage-data/transactions), [seguridad de clientes y servidores](https://firebase.google.com/docs/firestore/security/overview).

## Integridad del saldo y del canje

El navegador envía el token de Firebase Auth, acciones, una revisión y un identificador de petición. La API verifica su firma con las claves públicas de Firebase Secure Token, además del proyecto emisor, la fecha y el correo verificado; después obtiene el UID. Nunca acepta un UID enviado como dato del juego. Después determina tiempo, azar, inventario y saldo. Una transacción guarda partida y vale juntos, reserva hasta el cupo diario de emisión y conserva un recibo para reintentos. Una revisión evita gastar dos veces desde pestañas desactualizadas. Los últimos 40 recibos se conservan; peticiones más antiguas quedan rechazadas por su revisión.

El PDF acepta únicamente un folio existente. No acepta nombre, importe ni fechas como autoridad. El folio contiene 96 bits aleatorios y su enlace permite consultar el registro actual. El PDF por sí solo no sustituye esa consulta: puede copiarse o editarse, por lo que el administrador debe utilizar los datos guardados. Una segunda acreditación del mismo folio se rechaza transaccionalmente.

La clave de administración se envía en cabecera y no se guarda en el navegador. El panel marca el folio como canjeado **antes** de que el administrador acredite manualmente las monedas en el grupo. Si falla la conexión al confirmar, consultar otra vez el folio antes de actuar. Si se marcó canjeado pero falta acreditar, completar la acreditación manual y anotarla en el grupo. No repetirla.

## Identidad, privacidad y progreso anterior

La partida y el límite diario se vinculan al UID verificado de Firebase Auth del juego existente. La API exige un token válido y una cuenta con correo verificado para abrir o modificar el huerto. Un mismo usuario recupera la misma partida al cambiar de navegador. No se comprueba la identidad de Messenger: el administrador debe contrastar el nombre del vale con el miembro que lo presenta.

La cookie aleatoria de la versión anterior solo se lee para migrar el huerto existente al primer UID que lo abra en ese navegador. Se conserva la misma partida y los mismos folios, por lo que el canje administrativo sigue actualizando su historial. Una partida ya vinculada no puede ser reclamada por otra cuenta. Si existen partidas anteriores en varios navegadores, la primera vinculada se usa para la cuenta y las demás no se fusionan automáticamente.

Quien tenga un folio puede consultar su nombre declarado, importe y estado; no publicar folios fuera del grupo. No se expone un listado de jugadores o vales.

Las partidas del prototipo `einherjar-agro-v1` se conservan intactas en localStorage como respaldo. Sus saldos, PDF y semillas estaban controlados por el cliente y **no se importan al registro verificado**. El nuevo evento inicia con una semilla común por linaje y 5 polen. Esto evita convertir saldos editables del prototipo en monedas válidas. Si hubiera jugadores de una prueba anterior, resolver cualquier compensación manualmente antes de abrir el evento.

## Economía

El canje es una acreditación manual en el grupo, no un pago automático ni dinero real. Se mantiene el importe nominal del vale; los premios o usos de esas monedas los establece la administración. No se definieron compras, caducidad ni fecha de cierre.

Por cuenta se permiten **2.000 monedas cosechadas, 2.000 monedas emitidas en vales y 500 acciones completadas por día**. Los contadores se guardan con la partida en la misma transacción y se reinician a las 00:00 de Argentina. Cada invocación de diez cuenta como una acción; las consultas, descargas, solicitudes fallidas y canjes administrativos no cuentan. Reintentar una acción con el mismo identificador recupera el recibo anterior sin consumir otro cupo. Al llegar al límite de cosecha, el excedente permanece en la planta; al llegar al límite de vales, el saldo sin reservar permanece en el huerto. Una fusión o retirada se rechaza si descartaría monedas pendientes.

El límite reduce las escrituras y acota el importe emitido **por cuenta de Firebase**. Cambiar de navegador o borrar cookies no crea otro cupo con el mismo login. No bloquea solicitudes maliciosas ni impide que una persona registre varias cuentas; para una sola cuenta por miembro de Messenger haría falta validar la membresía y aplicar controles de tráfico.
