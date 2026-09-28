'use client';

import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type FormEvent } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, signOut } from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { GlassCard } from '@/components/juego/GlassCard';
import { Icon } from '@/components/juego/Icon';
import { LobbyPageHeader } from '@/components/juego/LobbyPageHeader';
import { Spinner } from '@/components/juego/Spinner';
import { useUserData } from '@/hooks/useUserData';
import { useDialog } from '@/providers/DialogProvider';
import { cn } from '@/lib/utils';

const AVATAR_SIZE = 128;

/**
 * Center-crops the picked image to a square and encodes it as a small JPEG
 * data URI. Keeps the private profile document well under Firestore's 1MB
 * limit on the Spark plan.
 */
async function encodeAvatar(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen.');
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE
  );
  bitmap.close();
  const dataUri = canvas.toDataURL('image/jpeg', 0.2);
  if (dataUri.length > 150000) {
    throw new Error('La imagen resultante es demasiado grande.');
  }
  return dataUri;
}

function readPreferences(uid: string | undefined) {
  const preferences = { music: true, sfx: true };
  if (!uid) return preferences;
  try {
    const stored = window.localStorage.getItem(`preferences:${uid}`);
    if (stored) {
      const parsed = JSON.parse(stored) as { music?: boolean; sfx?: boolean };
      if (typeof parsed.music === 'boolean') preferences.music = parsed.music;
      if (typeof parsed.sfx === 'boolean') preferences.sfx = parsed.sfx;
    }
  } catch {
    // Storage unavailable (private mode) — keep defaults.
  }
  return preferences;
}

function Switch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      className={cn(
        'relative h-7 w-[52px] shrink-0 rounded-full border transition-colors',
        value ? 'border-gold bg-gold/30 shadow-[0_0_10px_rgba(201,170,113,0.35)]' : 'border-white/15 bg-white/10'
      )}
    >
      <span
        className={cn(
          'absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-all',
          value ? 'left-[27px] bg-gold' : 'left-[3px] bg-white/60'
        )}
      />
    </button>
  );
}

export default function ProfilePage() {
  const dialog = useDialog();
  const { userData, error: userDataError } = useUserData();
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [securityBusy, setSecurityBusy] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Forms start from the synced profile (the route guard waits for it).
  const [username, setUsername] = useState<string>(() => userData?.username || '');
  const [frase, setFrase] = useState<string>(() => userData?.frase || '');

  const uid = auth.currentUser?.uid;
  const [preferences, setPreferences] = useState(() => readPreferences(uid));
  const { music, sfx } = preferences;

  // Preferences are per-device, like AsyncStorage on mobile.
  useEffect(() => {
    if (!uid) return;
    try {
      window.localStorage.setItem(`preferences:${uid}`, JSON.stringify(preferences));
    } catch {
      // Storage unavailable — preferences just won't persist.
    }
  }, [preferences, uid]);

  const setMusic = (value: boolean) => setPreferences((prev) => ({ ...prev, music: value }));
  const setSfx = (value: boolean) => setPreferences((prev) => ({ ...prev, sfx: value }));

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!auth.currentUser) return;
    const normalizedUsername = username.trim();
    const normalizedPhrase = frase.trim();
    if (!normalizedUsername) {
      void dialog.alert('Nombre requerido', 'Ingresa un nombre de guerrero válido.');
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        username: normalizedUsername,
        frase: normalizedPhrase,
      });
      void dialog.alert('Perfil actualizado', 'Tus cambios se guardaron correctamente.');
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('Error saving profile:', (error as Error)?.message);
      void dialog.alert('Error', 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !auth.currentUser) return;
    if (!file.type.startsWith('image/')) {
      void dialog.alert('Archivo no válido', 'Elige una imagen para tu avatar.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const dataUri = await encodeAvatar(file);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { avatar: dataUri });
      void dialog.alert('Avatar actualizado', 'Tu nuevo avatar se guardó correctamente.');
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('Error uploading avatar:', (error as Error)?.message);
      void dialog.alert('Error', 'No se pudo actualizar el avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    const ok = await dialog.confirm('Cerrar sesión', '¿Quieres salir de tu cuenta?', {
      confirmText: 'Cerrar sesión',
      destructive: true,
    });
    if (!ok) return;
    setSecurityMessage(null);
    try {
      // The route guard sends the user back to /juego/login.
      await signOut(auth);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('Error logging out:', (error as Error)?.message);
      setSecurityMessage({ type: 'error', text: 'No se pudo cerrar la sesión.' });
    }
  };

  const handlePasswordChange = async () => {
    setSecurityMessage(null);
    const currentUser = auth.currentUser;
    const email = currentUser?.email;
    if (!currentUser || !email) {
      setSecurityMessage({ type: 'error', text: 'Esta cuenta no tiene un correo asociado.' });
      return;
    }
    if (!currentUser.providerData.some((provider) => provider.providerId === 'password')) {
      setSecurityMessage({
        type: 'info',
        text: 'Esta cuenta utiliza Google. La contraseña se administra desde Google.',
      });
      return;
    }
    setSecurityBusy(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSecurityMessage({ type: 'success', text: `Enviamos el enlace para cambiar la contraseña a ${email}.` });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('Password change error:', (error as Error)?.message);
      setSecurityMessage({ type: 'error', text: 'No se pudo enviar el correo para cambiar la contraseña.' });
    } finally {
      setSecurityBusy(false);
    }
  };

  const totalBattles = (userData?.victorias || 0) + (userData?.derrotas || 0);
  const winrate = totalBattles > 0 ? Math.round(((userData?.victorias || 0) / totalBattles) * 100) : 0;

  const sectionHeading = (title: string, subtitle: string) => (
    <div className="mb-3 mt-10">
      <h2 className="font-title text-xl text-white/95">{title}</h2>
      <p className="mt-1 text-xs text-white/45">{subtitle}</p>
    </div>
  );

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-[15px] text-white/95 outline-none transition placeholder:text-white/35 focus:border-gold/60 focus:bg-black/50 focus:ring-4 focus:ring-gold/10';

  return (
    <>
      <main className="relative z-10 mx-auto w-full max-w-[1120px] px-4 pb-32 pt-8 sm:px-6 md:pb-16 md:pt-10">
        <LobbyPageHeader
          eyebrow="Identidad del jugador"
          title="Perfil y ajustes"
          subtitle="Administra tu identidad, preferencias y seguridad."
        />

        {userDataError ? (
          <p
            className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.07] px-4 py-3 text-[13px] text-red-300"
            role="alert"
          >
            <Icon name="cloud-offline" size={16} />
            No se pudo sincronizar tu perfil. Comprueba tu conexión.
          </p>
        ) : null}

        <section
          className="juego-rise relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#100e0c]"
          style={{ '--i': 1 } as CSSProperties}
        >
          <div className="relative h-32 sm:h-44">
            <img src="/juego/loading_screen/nathan.jpg" alt="" className="h-full w-full object-cover object-[center_30%] opacity-70" />
            <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(16,14,12,0.1),#100e0c)]" />
          </div>

          <div className="relative -mt-14 flex flex-col gap-5 px-5 pb-6 sm:-mt-16 sm:px-8 md:flex-row md:items-end md:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
              <div className="relative h-28 w-28 shrink-0">
                {uploadingAvatar ? (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-[3px] border-gold bg-[#0b0a09]">
                    <Spinner size={28} className="text-gold" />
                  </div>
                ) : userData?.avatar ? (
                  <img
                    src={userData.avatar}
                    alt={`Avatar de ${username || 'Guerrero'}`}
                    className="h-28 w-28 rounded-full border-[3px] border-gold object-cover shadow-[0_0_40px_rgba(201,170,113,0.35)]"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-[3px] border-gold bg-[#17140f] shadow-[0_0_40px_rgba(201,170,113,0.35)]">
                    <Icon name="person" size={46} color="#c9aa71" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar || Boolean(userDataError)}
                  aria-busy={uploadingAvatar || undefined}
                  className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#100e0c] bg-gold text-[#0b0a09] transition hover:brightness-110 disabled:opacity-60"
                  aria-label="Cambiar avatar"
                >
                  <Icon name="camera" size={16} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
              </div>

              <div className="min-w-0 pb-1">
                <p className="truncate font-title text-2xl text-white sm:text-3xl">{username || 'Guerrero'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#0b0a09]">
                    <Icon name="shield" size={12} />
                    {userData?.rango || 'Iniciado'}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-[#67d9e7]/40 bg-[#67d9e7]/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-[#9be8f2]">
                    NIVEL {userData?.nivel || 1}
                  </span>
                </div>
                <p className="mt-2 truncate text-xs text-white/45">{auth.currentUser?.email}</p>
                <p className="mt-1 line-clamp-2 text-sm italic text-white/70">“{frase || 'Forjando mi destino...'}”</p>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/[0.08] bg-black/30 py-3 md:min-w-[320px]">
              {[
                { value: userData?.nivel || 1, label: 'Nivel' },
                { value: (userData?.copas || 0).toLocaleString('es'), label: 'Copas' },
                { value: `${winrate}%`, label: 'Winrate' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center px-3">
                  <p className="text-xl font-bold tabular-nums text-white">{stat.value}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gold">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-x-6 md:grid-cols-2">
          <div>
            {sectionHeading('Personalización', 'Cómo te verán los demás')}
            <GlassCard contentClassName="p-5">
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="perfil-nombre" className="mb-1.5 block text-[11px] font-bold tracking-[0.12em] text-white/60">
                    NOMBRE DE GUERRERO
                  </label>
                  <input
                    id="perfil-nombre"
                    className={inputClass}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ej. Rey Arturo"
                    maxLength={20}
                    autoCapitalize="words"
                  />
                  <p className="mt-1 text-right text-[11px] text-white/40">{username.length}/20</p>
                </div>

                <div>
                  <label htmlFor="perfil-frase" className="mb-1.5 block text-[11px] font-bold tracking-[0.12em] text-white/60">
                    FRASE DE PERFIL
                  </label>
                  <textarea
                    id="perfil-frase"
                    className={cn(inputClass, 'min-h-[84px] resize-none')}
                    value={frase}
                    onChange={(e) => setFrase(e.target.value)}
                    placeholder="El honor es mi única recompensa..."
                    maxLength={40}
                  />
                  <p className="mt-1 text-right text-[11px] text-white/40">{frase.length}/40</p>
                </div>

                <button
                  type="submit"
                  disabled={saving || Boolean(userDataError)}
                  aria-busy={saving || undefined}
                  className="juego-sheen flex min-h-12 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#e2c68e,#c9aa71_55%,#a88a52)] text-sm font-bold tracking-[0.15em] text-[#0b0a09] shadow-[0_10px_30px_-12px_rgba(201,170,113,0.7)] transition hover:brightness-110 disabled:opacity-60"
                >
                  <Icon name="save-outline" size={18} />
                  {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                </button>
              </form>
            </GlassCard>
          </div>

          <div>
            {sectionHeading('Preferencias', 'Experiencia en este dispositivo')}
            <GlassCard contentClassName="p-5">
              {[
                { icon: 'musical-notes-outline', title: 'Música', description: 'Ambiente del lobby y combate', value: music, onChange: setMusic, label: 'Música' },
                { icon: 'volume-high-outline', title: 'Efectos', description: 'Sonidos de acciones y recompensas', value: sfx, onChange: setSfx, label: 'Efectos de sonido' },
              ].map((setting, i) => (
                <div key={setting.title}>
                  {i > 0 && <div className="my-4 h-px bg-white/10" />}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/10">
                        <Icon name={setting.icon} size={20} color="#c9aa71" />
                      </span>
                      <div>
                        <p className="text-[15px] font-bold text-white/95">{setting.title}</p>
                        <p className="text-xs text-white/50">{setting.description}</p>
                      </div>
                    </div>
                    <Switch value={setting.value} onChange={setting.onChange} label={setting.label} />
                  </div>
                </div>
              ))}
            </GlassCard>

            {sectionHeading('Cuenta y seguridad', 'Acciones sensibles de tu cuenta')}
            <GlassCard contentClassName="p-2">
              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={securityBusy}
                aria-busy={securityBusy || undefined}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-white/5 disabled:opacity-70"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/10">
                  {securityBusy ? <Spinner size={18} className="text-gold" /> : <Icon name="key-outline" size={20} color="#c9aa71" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-white/95">Cambiar contraseña</span>
                  <span className="block text-xs text-white/50">Recibe un enlace seguro por correo</span>
                </span>
                <Icon name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
              </button>

              {securityMessage ? (
                <p
                  aria-live="polite"
                  className={cn(
                    'mx-3 mb-2 text-xs',
                    securityMessage.type === 'success' && 'text-emerald-400',
                    securityMessage.type === 'error' && 'text-red-400',
                    securityMessage.type === 'info' && 'text-sky-300'
                  )}
                >
                  {securityMessage.text}
                </p>
              ) : null}

              <div className="mx-3 h-px bg-white/10" />

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-white/5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10">
                  <Icon name="log-out-outline" size={20} color="#ef4444" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-red-400">Cerrar sesión</span>
                  <span className="block text-xs text-white/50">Salir de esta cuenta en el dispositivo</span>
                </span>
                <Icon name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
              </button>
            </GlassCard>
          </div>
        </div>
      </main>
    </>
  );
}
