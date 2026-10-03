import { PDFDocument, StandardFonts, PDFName, PDFString, rgb } from 'pdf-lib';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { AgroVoucher } from './agroGame';
import { LEVELS } from './jardin/engine';

const ink = rgb(0.035, 0.075, 0.062);
const forest = rgb(0.075, 0.15, 0.12);
const gold = rgb(0.84, 0.69, 0.43);
const cream = rgb(0.94, 0.92, 0.84);
const muted = rgb(0.63, 0.7, 0.63);

function pdfText(value: string): string {
  // Standard PDF fonts support Latin characters but cannot encode emoji.
  return value.replace(/[^\u0020-\u00FF]/g, '').trim();
}

export async function createAgroVoucherPdf(
  voucher: AgroVoucher,
  verificationUrl: string,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const jardin = voucher.source === 'jardin';
  pdf.setTitle(`${jardin ? 'Vale del Jardín' : 'Vale de cosecha'} ${voucher.id}`);
  pdf.setSubject('Comprobante del evento agropecuario de Einherjar Blitz');
  pdf.setCreator(jardin ? 'Einherjar Blitz - Jardín de Yggdrasil' : 'Einherjar Blitz - El Huerto de Yggdrasil');

  const page = pdf.addPage([595.28, 841.89]);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const display = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const width = page.getWidth();

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height: page.getHeight(),
    color: ink,
  });
  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: 786,
    borderColor: gold,
    borderWidth: 1,
  });
  page.drawRectangle({
    x: 37,
    y: 37,
    width: width - 74,
    height: 768,
    borderColor: forest,
    borderWidth: 1,
  });
  page.drawText('EINHERJAR BLITZ', {
    x: 58,
    y: 754,
    size: 11,
    font: sansBold,
    color: gold,
  });
  page.drawText(jardin ? 'JARDÍN DE YGGDRASIL' : 'EL HUERTO DE YGGDRASIL', {
    x: 58,
    y: 704,
    size: 25,
    font: display,
    color: cream,
  });
  page.drawText(jardin ? 'VALE DE MONEDAS DE DEFENSA' : 'VALE DE MONEDAS DE COSECHA', {
    x: 58,
    y: 681,
    size: 10,
    font: sansBold,
    color: muted,
  });
  page.drawLine({
    start: { x: 58, y: 656 },
    end: { x: width - 58, y: 656 },
    thickness: 1,
    color: gold,
  });

  try {
    const imageBytes = await readFile(
      jardin
        ? path.join(process.cwd(), 'public', 'jardin', 'vale-solmiel.png')
        : path.join(process.cwd(), 'public', 'evento-agro', 'espiga-ambar.png'),
    );
    const art = await pdf.embedPng(imageBytes);
    const scaled = art.scaleToFit(198, 198);
    page.drawImage(art, {
      x: width - 70 - scaled.width,
      y: 448,
      width: scaled.width,
      height: scaled.height,
    });
  } catch {
    // The certificate remains valid as a document if artwork cannot load.
  }

  page.drawText(
    voucher.environment === 'local' ? 'DEMOSTRACIÓN LOCAL' : 'SALDO REGISTRADO',
    {
      x: 58,
      y: 606,
      size: 10,
      font: sansBold,
      color: muted,
    },
  );
  const amount = voucher.amount.toLocaleString('es-AR');
  page.drawText(amount, {
    x: 56,
    y: 523,
    size: Math.min(72, 275 / display.widthOfTextAtSize(amount, 1)),
    font: display,
    color: gold,
  });
  page.drawText('MONEDAS', {
    x: 60,
    y: 498,
    size: 13,
    font: sansBold,
    color: cream,
  });

  page.drawRectangle({
    x: 58,
    y: 294,
    width: width - 116,
    height: 154,
    color: forest,
  });
  const playerName = pdfText(voucher.playerName).slice(0, 48) || 'Jugador';
  const date = new Date(voucher.createdAt).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
  const rows = [
    ['JUGADOR', playerName],
    ['FOLIO', voucher.id],
    ['FECHA', pdfText(date)],
    jardin
      ? ['NIVELES SUPERADOS', `${voucher.plantsGrowing} de ${LEVELS.length}`]
      : ['COSECHA TOTAL', `${voucher.totalHarvested.toLocaleString('es-AR')} monedas`],
  ] as const;
  rows.forEach(([label, value], index) => {
    const y = 416 - index * 34;
    page.drawText(label, { x: 75, y, size: 8, font: sansBold, color: muted });
    page.drawText(value, {
      x: 202,
      y: y - 1,
      size: Math.min(11, 316 / sansBold.widthOfTextAtSize(value, 1)),
      font: sansBold,
      color: cream,
    });
  });

  page.drawText('PRESENTA ESTE PDF EN EL GRUPO DE MESSENGER', {
    x: 58,
    y: 244,
    size: 12,
    font: sansBold,
    color: gold,
  });
  page.drawText(
    'El administrador consulta el folio y registra un único canje.',
    {
      x: 58,
      y: 221,
      size: 11,
      font: sans,
      color: cream,
    },
  );
  page.drawText(
    'Este documento no acredita automáticamente monedas en el grupo.',
    {
      x: 58,
      y: 205,
      size: 11,
      font: sans,
      color: cream,
    },
  );
  page.drawLine({
    start: { x: 58, y: 174 },
    end: { x: width - 58, y: 174 },
    thickness: 0.6,
    color: gold,
  });
  page.drawText(
    voucher.environment === 'local'
      ? 'MUESTRA LOCAL: no válida para canjear monedas del evento.'
      : 'Saldo reservado al emitir. El nombre lo declara el jugador.',
    {
      x: 58,
      y: 151,
      size: 9,
      font: sans,
      color: muted,
    },
  );
  page.drawText(
    voucher.redeemedAt
      ? 'ESTADO AL DESCARGAR: CANJEADO'
      : 'ESTADO AL DESCARGAR: PENDIENTE',
    { x: 58, y: 130, size: 9, font: sansBold, color: gold },
  );
  page.drawText('CONSULTAR FOLIO Y ESTADO ACTUAL', {
    x: 58,
    y: 108,
    size: 10,
    font: sansBold,
    color: cream,
  });
  const annotation = pdf.context.register(
    pdf.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [56, 103, 370, 122],
      Border: [0, 0, 0],
      A: { Type: 'Action', S: 'URI', URI: PDFString.of(verificationUrl) },
    }),
  );
  page.node.set(PDFName.of('Annots'), pdf.context.obj([annotation]));
  page.drawText(jardin ? 'Einherjar Blitz  /  Jardín de Yggdrasil' : 'Einherjar Blitz  /  Evento agropecuario', {
    x: 58,
    y: 72,
    size: 9,
    font: sans,
    color: muted,
  });

  return pdf.save();
}
