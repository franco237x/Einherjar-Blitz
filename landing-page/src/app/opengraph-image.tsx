import { ImageResponse } from 'next/og';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';

export const alt = 'Einherjar Blitz · Portal del guerrero';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const [logo, art] = await Promise.all([
    readFile(join(process.cwd(), 'public/assets/einherjer-logo.jpg'), 'base64'),
    readFile(join(process.cwd(), 'public/juego/loading_screen/argos.jpg'), 'base64'),
  ]);

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#0b0a09', color: '#fff' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 72px', flex: 1 }}>
          <img src={`data:image/jpeg;base64,${logo}`} width={72} height={72} style={{ borderRadius: 14 }} alt="" />
          <div style={{ display: 'flex', marginTop: 44, fontSize: 18, letterSpacing: 8, color: '#c9aa71' }}>
            PORTAL DEL GUERRERO
          </div>
          <div style={{ display: 'flex', marginTop: 18, fontSize: 84, lineHeight: 1, letterSpacing: 4, fontWeight: 700 }}>
            Einherjar
          </div>
          <div style={{ display: 'flex', fontSize: 84, lineHeight: 1.05, letterSpacing: 4, fontWeight: 700, color: '#c9aa71' }}>
            Blitz
          </div>
          <div style={{ display: 'flex', marginTop: 32, fontSize: 26, color: 'rgba(255,255,255,0.6)', maxWidth: 520 }}>
            Invocaciones, economía y rangos. Ahora desde el navegador.
          </div>
        </div>
        <div style={{ display: 'flex', width: 440, height: '100%', position: 'relative' }}>
          <img
            src={`data:image/jpeg;base64,${art}`}
            width={440}
            height={630}
            style={{ objectFit: 'cover', width: 440, height: 630 }}
            alt=""
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 440,
              height: 630,
              display: 'flex',
              background: 'linear-gradient(90deg, #0b0a09 0%, rgba(11,10,9,0) 40%)',
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
