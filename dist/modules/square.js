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
exports.WebhookSignatureKey = exports.client = void 0;
exports.configWebhook = configWebhook;
exports.verifyWebhookMiddlewareGenerator = verifyWebhookMiddlewareGenerator;
exports.getSquareOrder = getSquareOrder;
exports.updateSquareOrderReference = updateSquareOrderReference;
exports.getSquareOrders = getSquareOrders;
exports.mapOrderToReceiptData = mapOrderToReceiptData;
const config_1 = __importDefault(require("../config"));
const square_1 = require("square");
const utils_1 = require("./utils");
exports.client = new square_1.Client({
    environment: square_1.Environment.Production,
    accessToken: config_1.default.SQUARE_ACCESS_TOKEN,
});
function listWebhooks() {
    return __awaiter(this, void 0, void 0, function* () {
        const webhookApi = exports.client.webhookSubscriptionsApi;
        try {
            const { result } = yield webhookApi.listWebhookSubscriptions();
            console.log('Webhooks:', result);
            return result;
        }
        catch (error) {
            console.error('Error listing webhooks:', error);
        }
    });
}
function createWebhook(name, url, eventTypes) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const webhookApi = exports.client.webhookSubscriptionsApi;
        try {
            const { result } = yield webhookApi.createWebhookSubscription({
                idempotencyKey: `galafries-webhook-${Date.now()}`,
                subscription: {
                    enabled: true,
                    notificationUrl: url,
                    name,
                    eventTypes,
                },
            });
            console.log('Webhook added:', (_a = result === null || result === void 0 ? void 0 : result.subscription) === null || _a === void 0 ? void 0 : _a.id);
            return result;
        }
        catch (error) {
            console.error('Error adding webhook:', error);
        }
    });
}
function deleteWebhook(webhookId) {
    return __awaiter(this, void 0, void 0, function* () {
        const webhookApi = exports.client.webhookSubscriptionsApi;
        try {
            const { result } = yield webhookApi.deleteWebhookSubscription(webhookId);
            console.log('Webhook deleted:', webhookId, result);
            return result;
        }
        catch (error) {
            console.error('Error deleting webhook:', error);
        }
    });
}
exports.WebhookSignatureKey = {};
function configWebhook(locationId, endpointName, publicServerUrl, events) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const webhookName = `${locationId}--${endpointName}`;
        const webhookList = yield listWebhooks();
        const webhook = (_a = webhookList === null || webhookList === void 0 ? void 0 : webhookList.subscriptions) === null || _a === void 0 ? void 0 : _a.find((subscription) => subscription.name === webhookName);
        if (webhook === null || webhook === void 0 ? void 0 : webhook.id) {
            console.log(`Webhook ${webhookName} found #${webhook.id}, now deleting...`);
            yield deleteWebhook(webhook.id);
        }
        console.log(`Webhook ${webhookName} now creating...`);
        const result = yield createWebhook(webhookName, `${publicServerUrl}/webhook/${endpointName}`, events);
        console.log(`Webhook ${webhookName} #${(_b = result === null || result === void 0 ? void 0 : result.subscription) === null || _b === void 0 ? void 0 : _b.id} created successfully!`, result);
        exports.WebhookSignatureKey[webhookName] = {
            name: webhookName,
            url: ((_c = result === null || result === void 0 ? void 0 : result.subscription) === null || _c === void 0 ? void 0 : _c.notificationUrl) || '',
            signatureKey: ((_d = result === null || result === void 0 ? void 0 : result.subscription) === null || _d === void 0 ? void 0 : _d.signatureKey) || '',
        };
    });
}
function verifyWebhookMiddlewareGenerator(webhookName) {
    return (req, res, next) => {
        var _a, _b;
        // Local Bypass
        const ip = req.ip;
        if ((0, utils_1.isIpLocal)(ip)) {
            req.body = JSON.parse(req.body.toString('utf-8'));
            next();
            return;
        }
        const body = req.body;
        const signature = req.headers['x-square-hmacsha256-signature'];
        const signatureKey = (_a = exports.WebhookSignatureKey[webhookName]) === null || _a === void 0 ? void 0 : _a.signatureKey;
        const url = (_b = exports.WebhookSignatureKey[webhookName]) === null || _b === void 0 ? void 0 : _b.url;
        console.log('Webhook verification: ', body, signature, signatureKey, url);
        if (square_1.WebhooksHelper.isValidWebhookEventSignature(body, signature, signatureKey, url)) {
            req.body = JSON.parse(req.body.toString('utf-8'));
            next();
            return;
        }
        console.log('Error: webhook request is not from Square POS');
        res.status(401).send({ error: 'Not from Square POS' });
    };
}
function getSquareOrder(orderId) {
    return __awaiter(this, void 0, void 0, function* () {
        const orderApi = exports.client.ordersApi;
        try {
            const { result: { order }, } = yield orderApi.retrieveOrder(orderId);
            console.log(`Order ${orderId} received: `, order);
            return order;
        }
        catch (error) {
            console.error(`Error getting oreder ${orderId}: `, error);
        }
    });
}
function updateSquareOrderReference(order, reference) {
    return __awaiter(this, void 0, void 0, function* () {
        const orderApi = exports.client.ordersApi;
        const orderId = order.id;
        const locationId = order.locationId;
        const version = order.version;
        try {
            const { result: { order }, } = yield orderApi.updateOrder(orderId, {
                order: {
                    locationId,
                    referenceId: reference,
                    ticketName: reference,
                    version,
                },
            });
            console.log(`Order ${orderId} updated: `, order);
            return order;
        }
        catch (error) {
            console.error(`Error getting order ${orderId}: `, error);
        }
    });
}
function getSquareOrders() {
    return __awaiter(this, arguments, void 0, function* (count = 50) {
        const orderApi = exports.client.ordersApi;
        try {
            const { result: { orders }, } = yield orderApi.searchOrders({
                limit: count,
                locationIds: [config_1.default.LOCATION_ID],
                query: { sort: { sortField: 'CREATED_AT', sortOrder: 'DESC' } },
                returnEntries: false,
            });
            console.log(`${count} orders received: `);
            return orders;
        }
        catch (error) {
            console.error(`Error getting orders: `, error);
        }
    });
}
function mapOrderToReceiptData(order, index) {
    var _a, _b;
    const date = new Date(order === null || order === void 0 ? void 0 : order.createdAt);
    if (!order) {
        return {
            title: '',
            id: '',
            index: index || -1,
            date,
            lineItems: [],
            surcharges: [],
            discounts: [],
            totals: '0',
        };
    }
    return {
        title: 'GalaFries',
        id: `${(_a = order.tenders) === null || _a === void 0 ? void 0 : _a.map((tender) => { var _a; return ((_a = tender.id) === null || _a === void 0 ? void 0 : _a.slice(0, 4)) || ''; })} - ${(order.id || '').slice(0, 5)}`,
        index: index || -1,
        date,
        lineItems: (order.lineItems || []).map((line) => {
            var _a;
            return ({
                name: line.name || '',
                quantity: parseInt(line.quantity || '0'),
                price: (Number(((_a = line.basePriceMoney) === null || _a === void 0 ? void 0 : _a.amount) || 0) / 100).toFixed(2),
                description: `${line.variationName} ${(line.modifiers || []).map((m) => m === null || m === void 0 ? void 0 : m.name).join(' ')} ${line.note || ''}`,
            });
        }) || [],
        surcharges: (order.serviceCharges || []).map((charge) => {
            var _a;
            return ({
                name: charge.name || '',
                price: (Number(((_a = charge.appliedMoney) === null || _a === void 0 ? void 0 : _a.amount) || '0') / 100).toFixed(2),
            });
        }),
        discounts: (order.discounts || []).map((discount) => {
            var _a;
            return ({
                name: discount.name || '',
                price: (Number(((_a = discount.appliedMoney) === null || _a === void 0 ? void 0 : _a.amount) || 0) / 100).toFixed(2),
            });
        }),
        totals: (Number(((_b = order.totalMoney) === null || _b === void 0 ? void 0 : _b.amount) || 0) / 100).toFixed(2),
    };
}
