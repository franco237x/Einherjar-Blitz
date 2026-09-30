# Economía del juego en el servidor (plan Spark)

## Qué decide el servidor

| Flujo | Dónde se decide | Ruta |
| --- | --- | --- |
| Invocaciones (gacha) | Servidor: tirada con `crypto`, cobro, registro e inventario en una transacción | `POST /api/juego/gacha` |
| Batallas | Servidor: entrega la semilla, re-simula las acciones y otorga premios | `POST /api/juego/batalla` |
| Conversión de llaves, transferencias, tienda y canjes | Cliente, validado por `firestore.rules` | — |

Los flujos que quedan en el cliente no crean valor: las reglas exigen un débito exacto, enlazado a su registro en `operations`. El gacha y las batallas sí crean valor, así que el navegador ya no puede escribirlos. Las reglas deniegan `gachaPulls`, la creación de `inventory`, `battles`, `game/profile` y los contadores de victorias y copas.

### Gacha

1. El cliente envía `bannerId`, `amount` (1 o 10) y un `operationId` (`gacha_<uuid>`).
2. El servidor verifica el token de Firebase: firma, proyecto, vencimiento y correo verificado. El UID sale del token.
3. En una transacción comprueba el saldo, tira con `crypto.randomInt` sobre la tabla de pesos de `gachaData.ts` y escribe el débito, `gachaPulls/{op}` (con los resultados), los objetos de `inventory` y el asiento de `operations`.
4. Si se repite la petición con el mismo `operationId`, devuelve el resultado guardado sin cobrar otra vez.

### Batallas

1. `accion: "iniciar"`: el servidor crea `users/{uid}/battles/{id}` con una semilla aleatoria de 128 bits y la devuelve.
2. El cliente juega con `createSeededRng(semilla)` y registra cada acción (`attack`, `defend`, `regen`, `special`).
3. `accion: "terminar"`: el servidor re-juega la partida con `replayBattle` (el mismo motor que el cliente) y así obtiene el resultado. Rechaza secuencias ilegales, partidas sin terminar, batallas de más de 2 h y batallas más rápidas que 1 s por turno del jefe.
4. Límites por cuenta y día (hora de Argentina): **20 victorias con premio** y **120 combates iniciados** (`src/constants/battleRewards.ts`). Tras el límite la victoria se registra sin premio.

Conocer la semilla solo permite prever la partida propia, es decir, jugar mejor. El techo diario acota lo que se puede ganar, incluso con un bot.

## Configuración (una vez)

El Admin SDK con Firestore funciona en el plan **Spark**, sin coste. No hace falta Blaze ni Cloud Functions.

1. En Google Cloud, proyecto `einherjer-blitz-7578c` (el del login del juego, **no** el del huerto): IAM → Cuentas de servicio → crear `game-server`. Darle el rol `Cloud Datastore User` (`roles/datastore.user`) y generar una clave JSON.
2. En Vercel → Settings → Environment Variables, agregar `GAME_FIREBASE_SERVICE_ACCOUNT_JSON` con el JSON completo (Production y Preview). No usar el prefijo `NEXT_PUBLIC_` ni subir el JSON al repositorio.
3. Para desarrollo local: la misma variable en `.env.local`, o `GOOGLE_APPLICATION_CREDENTIALS` con la ruta del archivo.

Sin esa credencial, las rutas responden 503 ("El servidor del juego todavía no está configurado") y **no se cobra nada**.

## Orden de despliegue (importante)

1. Configurar `GAME_FIREBASE_SERVICE_ACCOUNT_JSON` en Vercel.
2. Desplegar esta versión de la web y probar una invocación de 1 con una cuenta de prueba.
3. Recién entonces publicar las reglas: `npx firebase-tools deploy --only firestore:rules` desde `landing-page/`. Usa `firebase.json`, `.firebaserc` y el proyecto `einherjer-blitz-7578c`.

Si se publican las reglas antes que la web, las invocaciones fallarán hasta el despliegue. Si se despliega la web sin publicar las reglas, todo funciona, pero el agujero anterior sigue abierto.

Las reglas del huerto (`firestore.agro.rules`, base `agro` de otro proyecto) no cambian. Siguen publicándose con `firebase.agro.json`.

## Pruebas

- `npm test`: motor de batalla, re-simulación cliente/servidor y validación del gacha.
- `npm run test:rules`: reglas de Firestore en el emulador (requiere Java; descarga `firebase-tools` con npx). Incluye los ataques anteriores (inventario elegido por el cliente, victorias sin batalla) y los flujos que deben seguir funcionando.
