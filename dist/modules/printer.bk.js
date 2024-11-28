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
exports.printImage = printImage;
const escpos_1 = __importDefault(require("escpos"));
// install escpos-usb adapter module manually
escpos_1.default.USB = require('escpos-usb');
// Select the adapter based on your printer type
const device = new escpos_1.default.USB();
// const device  = new escpos.Network('localhost');
// const device  = new escpos.Serial('/dev/usb/lp0');
const options = { encoding: 'GB18030' /* default */ };
// encoding is optional
const printer = new escpos_1.default.Printer(device, options);
function printImage(url) {
    return __awaiter(this, void 0, void 0, function* () {
        device.open(function (error) {
            return __awaiter(this, void 0, void 0, function* () {
                if (error) {
                    console.error('Error connecting printer: ', error);
                }
                const image = yield escpos_1.default.Image.load('./receipt.png', 'image/png');
                printer.image(image, function (err) {
                    console.error('Error printing image: ', err);
                    this.cut();
                    this.close();
                });
            });
        });
    });
}
