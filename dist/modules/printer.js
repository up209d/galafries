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
exports.printViaUsbImage = printViaUsbImage;
const core_1 = require("@node-escpos/core");
const usb_adapter_1 = __importDefault(require("@node-escpos/usb-adapter"));
function printViaUsbImage(fileData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const device = new usb_adapter_1.default();
            const image = yield core_1.Image.load(fileData);
            return yield new Promise((res, rej) => {
                device.open(function (err) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (err) {
                            rej(err);
                        }
                        const options = { encoding: 'GB18030' /* default */ };
                        let printer = new core_1.Printer(device, options);
                        printer = yield printer.image(image, 'd24');
                        yield printer.cut().close();
                        res(true);
                    });
                });
            });
        }
        catch (err) {
            console.error('Error Printing: ', err);
            return;
        }
    });
}
