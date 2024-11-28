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
exports.setupTunneling = setupTunneling;
const ngrok_1 = __importDefault(require("ngrok"));
const config_1 = __importDefault(require("../config"));
function setupTunneling(freePort) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Server running on http://localhost:${freePort}`);
        console.log(`Now setup tunneling...`);
        // Start ngrok to expose the server
        try {
            yield ngrok_1.default.disconnect();
            yield ngrok_1.default.kill();
            const url = yield ngrok_1.default.connect({
                port: freePort,
                authtoken: config_1.default.NGROK_AUTH_TOKEN,
            });
            console.log(`Ngrok tunnel is live at ${url}`);
            return url;
        }
        catch (error) {
            console.error('Error starting ngrok:', error);
            throw error;
        }
    });
}
