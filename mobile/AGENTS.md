# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Battle rewards — Spark plan security model

The Firebase project is on the **Spark (free) plan**, which does NOT support
Cloud Functions. Without a server-side validator we cannot prove a battle
actually occurred. The defenses below are the maximum possible in Spark.

## Defenses in place

1. **Fixed increments** — `battleService.ts` writes rewards with `increment(N)`
   where N is a hardcoded constant. Firestore Rules enforce that the deltas
   match exactly (`copas +10`, `spheres +5`, `experiencia +15`, `victorias +1`,
   `jefes_derrotados +1`, `derrotas +1`). A client cannot inject
   `copas: 999999` — the rules reject it.

2. **Anti-replay (best-effort)** — before writing rewards, the client creates
   a doc at `users/{uid}/game/battles/{battleId}` with create-only semantics.
   Firestore rejects the create if the battleId already exists. The battle
   record collection is create-only (no update/delete).

3. **Rank consistency** — `rango` must match `rankForCopas(newCopas)`. A
   client cannot set an arbitrary rank.

## Known limitation (inherent to Spark)

A determined attacker can still farm rewards by generating fresh battleIds
in a loop. The rules cannot validate that a battle actually occurred — only
a server-side validator (Cloud Function) can do that.

## Upgrading to Blaze (future)

When the project is upgraded to the Blaze plan, write a Cloud Function
`onBattleComplete` that validates the battle server-side and writes rewards
via the Admin SDK (bypassing rules). Then tighten the rules to deny client
writes to all economy fields and remove the fixed-increment rules.

## Files

- `mobile/src/services/battleService.ts` — client-side reward writer with
  anti-replay.
- `mobile/firestore.rules` — fixed-increment + anti-replay rules.
