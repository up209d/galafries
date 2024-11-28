import escpos from 'escpos';
import Image from 'escpos/image';
// install escpos-usb adapter module manually
escpos.USB = require('escpos-usb');

// Select the adapter based on your printer type
const device = new escpos.USB();

// const device  = new escpos.Network('localhost');
// const device  = new escpos.Serial('/dev/usb/lp0');
const options = { encoding: 'GB18030' /* default */ };
// encoding is optional
const printer = new escpos.Printer(device, options);

export async function printImage(url?: string) {
  device.open(async function (error) {
    if (error) {
      console.error('Error connecting printer: ', error);
    }
    const image = await escpos.Image.load('./receipt.png', 'image/png');
    printer.image(image, function (err) {
      console.error('Error printing image: ', err);
      this.cut();
      this.close();
    });
  });
}
