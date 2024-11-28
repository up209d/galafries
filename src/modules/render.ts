import { Canvas, createCanvas } from 'canvas';
import fs from 'fs';

const PADDING = 40;
const FONT = 'Consolas, Monaco, monospace';

export function breakSpaceToLine(text: string, charLimit: number) {
  const words = text.split(' ');
  let index = 0;
  const lines: string[] = [];
  for (const word of words) {
    if (!lines[index]) {
      lines[index] = '';
    }
    lines[index] += `${word} `;
    if (lines[index].length + word.length >= charLimit) {
      index++;
    }
  }
  return lines;
}

export function addTitle(
  canvas: Canvas,
  yPosition: { value: number },
  title: string,
) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.font = `96px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(title, canvas.width / 2, yPosition.value);
  yPosition.value += 140;
}

export function addIndexRow(
  canvas: Canvas,
  yPosition: { value: number },
  index: number,
) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.font = `50px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`#${index}`, canvas.width / 2, yPosition.value);
  yPosition.value += 80;
}

export function addSubTitle(
  canvas: Canvas,
  yPosition: { value: number },
  subtitle: string,
) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.font = `40px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(
    subtitle,
    canvas.width / 2,
    yPosition.value,
  );
  yPosition.value += 60;
}

export function addSplitter(canvas: Canvas, yPosition: { value: number }) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.font = `60px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('------------------------', canvas.width / 2, yPosition.value);
  yPosition.value += 80;
}

export function addDateRow(
  canvas: Canvas,
  yPosition: { value: number },
  date: Date,
) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.font = `40px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(
    date.toLocaleString('en-au', {
      weekday: 'short', // Full day name
      year: 'numeric', // Full year (e.g., 2024)
      month: 'short', // Full month name (e.g., October)
      day: 'numeric', // Day of the month
      hour: '2-digit', // 2-digit hour
      minute: '2-digit', // 2-digit minute
      // second: '2-digit', // 2-digit second
      hour12: true, // 12-hour format (AM/PM)
    }),
    canvas.width / 2,
    yPosition.value,
  );
  yPosition.value += 60;
}

export function addHeadingRow(
  canvas: Canvas,
  yPosition: { value: number },
  heading: string,
  price?: string,
) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.font = `50px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(heading, 0, yPosition.value);
  if (price) {
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(price, canvas.width, yPosition.value);
  }
  yPosition.value += 80;
}

export function addItemMainRow(
  canvas: Canvas,
  yPosition: { value: number },
  name,
  quantity,
  price,
) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.font = `40px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(name, 0, yPosition.value);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(quantity, canvas.width * 0.69, yPosition.value);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(price, canvas.width, yPosition.value);
  yPosition.value += 60;
}

export function addItemSubRow(
  canvas: Canvas,
  yPosition: { value: number },
  sub: string,
) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.font = `36px ${FONT}`;
  for (const line of breakSpaceToLine(sub, 30)) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(line, 20, yPosition.value);
    yPosition.value += 50;
  }
  yPosition.value += 50;
}

export function addChargeRow(
  canvas: Canvas,
  yPosition: { value: number },
  name,
  price,
) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.font = `40px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(name, 0, yPosition.value);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(price, canvas.width, yPosition.value);
  yPosition.value += 60;
}

export type ReceiptData = {
  title: string;
  id: string;
  index: number;
  date: Date;
  lineItems: {
    name: string;
    quantity: number;
    price: string;
    description: string;
  }[];
  surcharges: {
    name: string;
    price: string;
  }[];
  discounts: {
    name: string;
    price: string;
  }[],
  totals: string;
};

export async function renderReceipt(
  size: 58 | 80,
  data: ReceiptData,
  preview?: boolean,
) {
  const yPosition = {
    value: PADDING,
  };
  const canvas = createCanvas(800, 3000);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 800, 3000);

  addTitle(canvas, yPosition, data.title);
  addIndexRow(canvas, yPosition, data.index % 1000);
  addSubTitle(canvas, yPosition, data.id);
  addDateRow(canvas, yPosition, data.date);
  addSplitter(canvas, yPosition);
  addHeadingRow(canvas, yPosition, 'Items');
  for (const line of data.lineItems) {
    addItemMainRow(
      canvas,
      yPosition,
      line.name,
      line.quantity,
      `$${line.price}`,
    );
    if (line.description) {
      addItemSubRow(canvas, yPosition, line.description);
    }
  }
  if (data.surcharges.length) {
    addSplitter(canvas, yPosition);
    addHeadingRow(canvas, yPosition, 'Surcharges');
    for (const surcharge of data.surcharges) {
      addChargeRow(canvas, yPosition, surcharge.name, `$${surcharge.price}`);
    }
  }
  if (data.discounts.length) {
    addSplitter(canvas, yPosition);
    addHeadingRow(canvas, yPosition, 'Discounts');
    for (const discount of data.discounts) {
      addChargeRow(canvas, yPosition, discount.name, `-$${discount.price}`);
    }
  }
  addSplitter(canvas, yPosition);
  addHeadingRow(canvas, yPosition, 'Totals', `$${data.totals}`);
  yPosition.value += 50;

  const croppedCanvas = createCanvas(canvas.width, yPosition.value + PADDING);
  const croppedCtx = croppedCanvas.getContext('2d');
  croppedCtx.drawImage(
    canvas,
    0,
    0,
    canvas.width,
    yPosition.value + PADDING,
    0,
    0,
    croppedCanvas.width,
    croppedCanvas.height,
  );
  return await new Promise<Canvas | undefined>(async (res) => {
    const resizedCanvas = await resizeCanvasForPrint(croppedCanvas, size);
    if (preview) {
      const out = fs.createWriteStream(__dirname + `/receipt.png`);
      const stream = resizedCanvas.createPNGStream();
      stream.pipe(out);
      out.on('finish', () => {
        console.log('Preview receipt saved as receipt.png');
      });
      res(undefined);
    }
    res(resizedCanvas);
  });
}

export async function resizeCanvasForPrint(
  canvas: Canvas,
  targetWidthMm: 58 | 80,
) {
  const dpi = 203; // Common
  const marginXInMm = 5;
  const targetWidthInInch = (targetWidthMm - marginXInMm * 2) / 25.4; // inch = 25.4mm
  const targetWidthPx = targetWidthInInch * dpi; // 1 dot = 1 pixel
  console.log('Canvas width in pixel: ', targetWidthPx);
  const aspectRatio = canvas.width / canvas.height;
  const targetHeightPx = targetWidthPx / aspectRatio;
  const resizedCanvas = createCanvas(targetWidthPx, targetHeightPx);
  const resizedCtx = resizedCanvas.getContext('2d');
  resizedCtx.drawImage(
    canvas,
    0,
    0,
    canvas.width,
    canvas.height,
    0,
    0,
    targetWidthPx,
    targetHeightPx,
  );
  return resizedCanvas;
}

renderReceipt(
  58,
  {
    title: 'GalaFries',
    id: 'XLGb0 - AfgH',
    index: 2,
    date: new Date(),
    lineItems: [
      {
        name: 'Burgers',
        quantity: 1,
        price: '14.5',
        description:
          'Beef, Tomato, Egg, The Lot, extra egg, extra beef, extra sauce, remember to not put everything all at one, wait cool down',
      },
      {
        name: 'Drinks',
        quantity: 11,
        price: '22.05',
        description: '',
      },
      {
        name: 'Sauces',
        quantity: 223,
        price: '123.45',
        description: '',
      },
    ],
    surcharges: [
      {
        name: 'Card (2.0%)',
        price: '1.05',
      },
      {
        name: 'PH Charge (10.0%)',
        price: '5.15',
      },
    ],
    discounts: [
      {
        name: 'Student (3.0%)',
        price: '1.05',
      },
      {
        name: 'Senior (10.0%)',
        price: '5.15',
      },
    ],
    totals: '555.05',
  },
  true,
)
  .then(() => console.log('Receipt Preview Rendered!!'))
  .catch(console.error);