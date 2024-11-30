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
const config_1 = __importDefault(require("./config"));
const express_1 = __importDefault(require("express"));
const find_free_port_1 = __importDefault(require("find-free-port"));
const ngrok_1 = require("./modules/ngrok");
const square_1 = require("./modules/square");
const render_1 = require("./modules/render");
const printer_1 = require("./modules/printer");
const path_1 = __importDefault(require("path"));
const utils_1 = require("./modules/utils");
const fireStore_1 = require("./modules/fireStore");
// Initialize Express app
const app = (0, express_1.default)();
const port = 3333;
const allowOnlyLocalRequestMiddleware = (req, res, next) => {
    const ip = req.ip;
    if ((0, utils_1.isIpLocal)(ip)) {
        next();
        return;
    }
    res.status(401).send({ error: 'Local access only' });
};
// Raw body for webhook
app.use('/webhook', express_1.default.raw({ type: 'application/json', limit: '10mb' }));
// Middleware for handling JSON requests
app.use(express_1.default.json());
// Middleware to parse URL-encoded bodies (if you need to handle forms)
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/logo', allowOnlyLocalRequestMiddleware, (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '/assets/logo.svg'));
});
app.get('/orders', allowOnlyLocalRequestMiddleware, (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '/pages/orders.html'));
});
app.get('/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Connection IP: ', req.ip);
    res.send({ status: 'ok' });
}));
app.get('/api/orders', allowOnlyLocalRequestMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const count = req.query.count
        ? parseInt(req.query.count)
        : undefined;
    const orders = yield (0, square_1.getSquareOrders)(count);
    const orderRefs = yield (0, fireStore_1.getLastOrders)(count);
    res.send({
        orders: (orders || []).map((order) => {
            var _a, _b, _c;
            return ({
                id: order.id,
                reference: ((_b = (_a = orderRefs
                    .find((ref) => ref.id === order.id)) === null || _a === void 0 ? void 0 : _a.index) === null || _b === void 0 ? void 0 : _b.toString().padStart(5, '0')) || '',
                date: order.createdAt,
                total: (Number(((_c = order.totalMoney) === null || _c === void 0 ? void 0 : _c.amount) || 0) / 100).toFixed(2),
                status: order.state,
                tenders: (order.tenders || []).map((tender) => {
                    var _a;
                    return ({
                        id: (_a = tender.id) === null || _a === void 0 ? void 0 : _a.slice(0, 4),
                    });
                }),
            });
        }),
    });
}));
app.post('/api/print-order', allowOnlyLocalRequestMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send({ message: 'Printing job is received' });
    const orderId = req.body.order_id;
    if (!orderId) {
        return;
    }
    const order = yield (0, square_1.getSquareOrder)(orderId);
    const orderRef = yield (0, fireStore_1.getOrderById)(orderId);
    const canvas = yield (0, render_1.renderReceipt)(58, (0, square_1.mapOrderToReceiptData)(order, orderRef === null || orderRef === void 0 ? void 0 : orderRef.index), true);
    if (canvas) {
        yield (0, printer_1.printViaUsbImage)((yield (0, render_1.resizeCanvasForPrint)(canvas, 58)).toDataURL());
    }
}));
const paymentOnCreatedWebhookVerification = (0, square_1.verifyWebhookMiddlewareGenerator)('payment-on-created');
app.post('/webhook/payment-on-created', paymentOnCreatedWebhookVerification, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    console.log('Payment created: ', (_c = (_b = (_a = req.body.data) === null || _a === void 0 ? void 0 : _a.object) === null || _b === void 0 ? void 0 : _b.payment) === null || _c === void 0 ? void 0 : _c.order_id);
    res.send({ message: 'Printing job is received' });
    const orderId = (_f = (_e = (_d = req.body.data) === null || _d === void 0 ? void 0 : _d.object) === null || _e === void 0 ? void 0 : _e.payment) === null || _f === void 0 ? void 0 : _f.order_id;
    const locationId = (_j = (_h = (_g = req.body.data) === null || _g === void 0 ? void 0 : _g.object) === null || _h === void 0 ? void 0 : _h.payment) === null || _j === void 0 ? void 0 : _j.location_id;
    if (!orderId || !locationId) {
        return;
    }
    if (locationId !== config_1.default.LOCATION_ID) {
        return;
    }
    const orderRef = yield (0, fireStore_1.addOrderReference)(orderId);
    const order = yield (0, square_1.getSquareOrder)(orderId);
    if (!order) {
        return;
    }
    const canvas = yield (0, render_1.renderReceipt)(58, (0, square_1.mapOrderToReceiptData)(order, orderRef === null || orderRef === void 0 ? void 0 : orderRef.index), false);
    if (canvas) {
        yield (0, printer_1.printViaUsbImage)((yield (0, render_1.resizeCanvasForPrint)(canvas, 58)).toDataURL());
        yield (0, printer_1.printViaUsbImage)((yield (0, render_1.resizeCanvasForPrint)(canvas, 58)).toDataURL());
    }
}));
(0, find_free_port_1.default)(port, (err, freePort) => {
    if (err) {
        console.error('Error finding a free port:', err);
        return;
    }
    // Start the server on the available port
    app.listen(freePort, () => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`Server running on http://localhost:${freePort}`);
        if (config_1.default.IS_TUNNELING) {
            const url = yield (0, ngrok_1.setupTunneling)(freePort);
            yield (0, square_1.configWebhook)(config_1.default.LOCATION_ID, 'payment-on-created', url, ['payment.created']);
        }
    }));
});
