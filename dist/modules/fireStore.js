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
exports.addOrderReference = addOrderReference;
exports.getOrderById = getOrderById;
exports.getLastOrders = getLastOrders;
const config_1 = __importDefault(require("../config"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(config_1.default.GOOGLE_FIREBASE_KEY),
});
const db = firebase_admin_1.default.firestore();
function addOrderReference(orderId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const orderAutoIndexDoc = yield db
            .collection('configs')
            .doc('orderAutoIndex');
        const order = yield db.runTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
            const orderAutoIndex = yield transaction.get(orderAutoIndexDoc);
            const orderAutoIndexData = orderAutoIndex.data();
            if (!orderAutoIndexData) {
                throw new Error('Error: no orderAutoIndex configuration found!');
            }
            transaction.set(orderAutoIndexDoc, { value: orderAutoIndexData.value + 1 });
            const newOrder = db.collection('orders').doc(orderId);
            transaction.set(newOrder, {
                index: orderAutoIndexData.value + 1,
            });
            console.log(`Add order ${orderId} with index ${orderAutoIndexData.value + 1}`);
            return newOrder;
        }));
        return { id: orderId, index: (_b = (_a = (yield order.get())) === null || _a === void 0 ? void 0 : _a.data()) === null || _b === void 0 ? void 0 : _b.index };
    });
}
function getOrderById(orderId) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield db.collection('orders').doc(orderId).get()).data();
    });
}
function getLastOrders() {
    return __awaiter(this, arguments, void 0, function* (count = 50) {
        return (yield db.collection('orders').orderBy('index', 'desc').limit(count).get()).docs.map((doc) => { var _a; return ({ id: doc.id, index: (_a = doc.data()) === null || _a === void 0 ? void 0 : _a.index }); });
    });
}
