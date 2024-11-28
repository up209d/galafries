"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.breakSpaceToLine = breakSpaceToLine;
exports.addTitle = addTitle;
exports.addIndexRow = addIndexRow;
exports.addSubTitle = addSubTitle;
exports.addSplitter = addSplitter;
exports.addDateRow = addDateRow;
exports.addHeadingRow = addHeadingRow;
exports.addItemMainRow = addItemMainRow;
exports.addItemSubRow = addItemSubRow;
exports.addChargeRow = addChargeRow;
exports.renderReceipt = renderReceipt;
exports.resizeCanvasForPrint = resizeCanvasForPrint;
const canvas_1 = require("canvas");
const fs_1 = __importDefault(require("fs"));
const PADDING = 40;
const FONT = 'Consolas, Monaco, monospace';
function breakSpaceToLine(text, charLimit) {
    const words = text.split(' ');
    let index = 0;
    const lines = [];
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
function addTitle(canvas, yPosition, title) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.font = `96px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(title, canvas.width / 2, yPosition.value);
    yPosition.value += 140;
}
function addIndexRow(canvas, yPosition, index) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.font = `50px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`#${index}`, canvas.width / 2, yPosition.value);
    yPosition.value += 80;
}
function addSubTitle(canvas, yPosition, subtitle) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.font = `40px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(subtitle, canvas.width / 2, yPosition.value);
    yPosition.value += 60;
}
function addSplitter(canvas, yPosition) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.font = `60px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('------------------------', canvas.width / 2, yPosition.value);
    yPosition.value += 80;
}
function addDateRow(canvas, yPosition, date) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.font = `40px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(date.toLocaleString('en-au', {
        weekday: 'short', // Full day name
        year: 'numeric', // Full year (e.g., 2024)
        month: 'short', // Full month name (e.g., October)
        day: 'numeric', // Day of the month
        hour: '2-digit', // 2-digit hour
        minute: '2-digit', // 2-digit minute
        // second: '2-digit', // 2-digit second
        hour12: true, // 12-hour format (AM/PM)
    }), canvas.width / 2, yPosition.value);
    yPosition.value += 60;
}
function addHeadingRow(canvas, yPosition, heading, price) {
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
function addItemMainRow(canvas, yPosition, name, quantity, price) {
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
function addItemSubRow(canvas, yPosition, sub) {
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
function addChargeRow(canvas, yPosition, name, price) {
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
function renderReceipt(size, data, preview) {
    return __awaiter(this, void 0, void 0, function* () {
        const yPosition = {
            value: PADDING,
        };
        const canvas = (0, canvas_1.createCanvas)(800, 3000);
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
            addItemMainRow(canvas, yPosition, line.name, line.quantity, `$${line.price}`);
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
        const croppedCanvas = (0, canvas_1.createCanvas)(canvas.width, yPosition.value + PADDING);
        const croppedCtx = croppedCanvas.getContext('2d');
        croppedCtx.drawImage(canvas, 0, 0, canvas.width, yPosition.value + PADDING, 0, 0, croppedCanvas.width, croppedCanvas.height);
        return yield new Promise((res) => __awaiter(this, void 0, void 0, function* () {
            const resizedCanvas = yield resizeCanvasForPrint(croppedCanvas, size);
            if (preview) {
                const out = fs_1.default.createWriteStream(__dirname + `/receipt.png`);
                const stream = resizedCanvas.createPNGStream();
                stream.pipe(out);
                out.on('finish', () => {
                    console.log('Preview receipt saved as receipt.png');
                });
                res(undefined);
            }
            res(resizedCanvas);
        }));
    });
}
function resizeCanvasForPrint(canvas, targetWidthMm) {
    return __awaiter(this, void 0, void 0, function* () {
        const dpi = 203; // Common
        const marginXInMm = 5;
        const targetWidthInInch = (targetWidthMm - marginXInMm * 2) / 25.4; // inch = 25.4mm
        const targetWidthPx = targetWidthInInch * dpi; // 1 dot = 1 pixel
        console.log('Canvas width in pixel: ', targetWidthPx);
        const aspectRatio = canvas.width / canvas.height;
        const targetHeightPx = targetWidthPx / aspectRatio;
        const resizedCanvas = (0, canvas_1.createCanvas)(targetWidthPx, targetHeightPx);
        const resizedCtx = resizedCanvas.getContext('2d');
        resizedCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, targetWidthPx, targetHeightPx);
        return resizedCanvas;
    });
}
renderReceipt(58, {
    title: 'GalaFries',
    id: 'XLGb0 - AfgH',
    index: 2,
    date: new Date(),
    lineItems: [
        {
            name: 'Burgers',
            quantity: 1,
            price: '14.5',
            description: 'Beef, Tomato, Egg, The Lot, extra egg, extra beef, extra sauce, remember to not put everything all at one, wait cool down',
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
}, true)
    .then(() => console.log('Receipt Preview Rendered!!'))
    .catch(console.error);
