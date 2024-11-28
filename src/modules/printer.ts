import { Printer, Image } from '@node-escpos/core';
import USB from '@node-escpos/usb-adapter';

export async function printViaUsbImage(fileData: string) {
  try {
    const device = new USB();
    const image = await Image.load(fileData);
    return await new Promise((res, rej) => {
      device.open(async function (err) {
        if (err) {
          rej(err);
        }
        const options = { encoding: 'GB18030' /* default */ };
        let printer = new Printer(device, options);
        printer = await printer.image(
          image,
          'd24', // density 8bit or 24bit
        );
        await printer.cut().close();
        res(true);
      });
    });
  } catch (err) {
    console.error('Error Printing: ', err);
    return;
  }
}
