"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isIpLocal = void 0;
const isIpLocal = (ip = '') => {
    return (ip === '127.0.0.1' || // IPv4 loopback
        ip === '::1' || // IPv6 loopback
        ip.startsWith('192.168.') || // Private IPv4 range
        ip.startsWith('10.') || // Private IPv4 range
        (ip >= '172.16.' && ip <= '172.31.')); // Private IPv4 range
};
exports.isIpLocal = isIpLocal;
