"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION_DATA = void 0;
require('dotenv').config({});
[
    'GOOGLE_FIREBASE_KEY',
    'NGROK_AUTH_TOKEN',
    'SQUARE_ACCESS_TOKEN',
    'LOCATION_ID',
    'IS_TUNNELING',
].forEach((env) => {
    if (!process.env[env]) {
        throw new Error(`Cannot get environment config ${env}`);
    }
});
exports.SESSION_DATA = {};
exports.default = {
    SESSION_DATA: exports.SESSION_DATA,
    GOOGLE_FIREBASE_KEY: JSON.parse(process.env.GOOGLE_FIREBASE_KEY),
    NGROK_AUTH_TOKEN: process.env.NGROK_AUTH_TOKEN,
    SQUARE_ACCESS_TOKEN: process.env.SQUARE_ACCESS_TOKEN,
    LOCATION_ID: process.env.LOCATION_ID,
    IS_TUNNELING: process.env.IS_TUNNELING === 'true',
};
