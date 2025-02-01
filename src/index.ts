import config from './config';
import express from 'express';
import findFreePort from 'find-free-port';
import { setupTunneling } from './modules/ngrok';
import {
  configWebhook,
  getSquareOrder,
  getSquareOrders,
  getSquareTodayOrders,
  mapOrderToReceiptData,
  verifyWebhookMiddlewareGenerator,
} from './modules/square';
import { renderReceipt, resizeCanvasForPrint } from './modules/render';
import { printViaUsbImage } from './modules/printer';
import path from 'path';
import { isIpLocal } from './modules/utils';
import {
  addOrderReference,
  getLastOrders,
  getOrderById,
} from './modules/fireStore';

// Initialize Express app
const app = express();
const port = 3333;

const allowOnlyLocalRequestMiddleware = (req, res, next) => {
  const ip = req.ip;
  if (isIpLocal(ip)) {
    next();
    return;
  }
  res.status(401).send({ error: 'Local access only' });
};

// Raw body for webhook
app.use('/webhook', express.raw({ type: 'application/json', limit: '10mb' }));

// Middleware for handling JSON requests
app.use(express.json());

// Middleware to parse URL-encoded bodies (if you need to handle forms)
app.use(express.urlencoded({ extended: true }));

app.get('/logo', allowOnlyLocalRequestMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, '/assets/logo.svg'));
});

app.get('/orders', allowOnlyLocalRequestMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, '/pages/orders.html'));
});

app.get('/health', async (req, res) => {
  console.log('Connection IP: ', req.ip);
  res.send({ status: 'ok' });
});

app.get(
  '/api/orders/today',
  allowOnlyLocalRequestMiddleware,
  async (req, res) => {
    const count = req.query.count
      ? parseInt(req.query.count as string)
      : undefined;
    const orders = await getSquareTodayOrders(count);
    const orderRefs = await getLastOrders(count);
    res.send({
      orders: (orders || []).map((order) => ({
        id: order.id,
        reference:
          orderRefs
            .find((ref) => ref.id === order.id)
            ?.index?.toString()
            .padStart(5, '0') || '',
        date: order.createdAt,
        total: (Number(order.totalMoney?.amount || 0) / 100).toFixed(2),
        status: order.state,
        tenders: (order.tenders || []).map((tender) => ({
          id: tender.id?.slice(0, 4),
        })),
      })),
    });
  },
);

app.get('/api/orders', allowOnlyLocalRequestMiddleware, async (req, res) => {
  const count = req.query.count
    ? parseInt(req.query.count as string)
    : undefined;
  const orders = await getSquareOrders(count);
  const orderRefs = await getLastOrders(count);
  res.send({
    orders: (orders || []).map((order) => ({
      id: order.id,
      reference:
        orderRefs
          .find((ref) => ref.id === order.id)
          ?.index?.toString()
          .padStart(5, '0') || '',
      date: order.createdAt,
      total: (Number(order.totalMoney?.amount || 0) / 100).toFixed(2),
      status: order.state,
      tenders: (order.tenders || []).map((tender) => ({
        id: tender.id?.slice(0, 4),
      })),
    })),
  });
});

app.post(
  '/api/print-order',
  allowOnlyLocalRequestMiddleware,
  async (req, res) => {
    res.send({ message: 'Printing job is received' });
    const orderId = req.body.order_id;
    if (!orderId) {
      return;
    }
    const order = await getSquareOrder(orderId);
    const orderRef = await getOrderById(orderId);
    const canvas = await renderReceipt(
      58,
      mapOrderToReceiptData(order, orderRef?.index),
      false,
    );
    if (canvas) {
      await printViaUsbImage(
        (await resizeCanvasForPrint(canvas, 58)).toDataURL(),
      );
    }
  },
);

const paymentOnCreatedWebhookVerification =
  verifyWebhookMiddlewareGenerator('payment-on-created');

app.post(
  '/webhook/payment-on-created',
  paymentOnCreatedWebhookVerification,
  async (req, res) => {
    console.log(
      'Payment created: ',
      req.body.data?.object?.payment?.order_id,
      // JSON.stringify(req.body),
    );
    res.send({ message: 'Printing job is received' });
    const orderId = req.body.data?.object?.payment?.order_id;
    const locationId = req.body.data?.object?.payment?.location_id;
    if (!orderId || !locationId) {
      return;
    }
    if (locationId !== config.LOCATION_ID) {
      return;
    }
    const orderRef = await addOrderReference(orderId);
    const order = await getSquareOrder(orderId);
    if (!order) {
      return;
    }
    const canvas = await renderReceipt(
      58,
      mapOrderToReceiptData(order, orderRef?.index),
      false,
    );
    if (canvas) {
      await printViaUsbImage(
        (await resizeCanvasForPrint(canvas, 58)).toDataURL(),
      );
    }
  },
);

findFreePort(port, (err, freePort) => {
  if (err) {
    console.error('Error finding a free port:', err);
    return;
  }
  // Start the server on the available port
  app.listen(freePort, async () => {
    console.log(`Server running on http://localhost:${freePort}`);
    if (config.IS_TUNNELING) {
      const url = await setupTunneling(freePort);
      await configWebhook(config.LOCATION_ID, 'payment-on-created', url, [
        'payment.created',
      ]);
    }
  });
});

// const test = async () => {
//   const testOrder = await getSquareOrder('PEG0EtqLve7tkBKnF4oUHDA2MBfZY');
//   console.log('Test Order: ', testOrder?.lineItems?.[0]);
//   if (testOrder) {
//     await renderReceipt(58, mapOrderToReceiptData(testOrder, 9999), true);
//   }
// };

// test().finally(() => console.log('Test Order processed!'));

process.on('SIGINT', () => {
  console.log('Process interrupted! Exiting...');
  process.exit();
});

process.on('SIGTERM', () => {
  console.log('Process terminated! Exiting...');
  process.exit();
});
