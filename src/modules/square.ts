import config from '../config';
import { Client, Environment, Order, WebhooksHelper } from 'square';
import { ReceiptData } from './render';
import { isIpLocal } from './utils';
import moment from 'moment-timezone';

export const client = new Client({
  environment: Environment.Production,
  accessToken: config.SQUARE_ACCESS_TOKEN,
});

async function listWebhooks() {
  const webhookApi = client.webhookSubscriptionsApi;
  try {
    const { result } = await webhookApi.listWebhookSubscriptions();
    console.log('Webhooks:', result);
    return result;
  } catch (error) {
    console.error('Error listing webhooks:', error);
  }
}

async function createWebhook(name: string, url: string, eventTypes: string[]) {
  const webhookApi = client.webhookSubscriptionsApi;
  try {
    const { result } = await webhookApi.createWebhookSubscription({
      idempotencyKey: `galafries-webhook-${Date.now()}`,
      subscription: {
        enabled: true,
        notificationUrl: url,
        name,
        eventTypes,
      },
    });
    console.log('Webhook added:', result?.subscription?.id);
    return result;
  } catch (error) {
    console.error('Error adding webhook:', error);
  }
}

async function deleteWebhook(webhookId) {
  const webhookApi = client.webhookSubscriptionsApi;
  try {
    const { result } = await webhookApi.deleteWebhookSubscription(webhookId);
    console.log('Webhook deleted:', webhookId, result);
    return result;
  } catch (error) {
    console.error('Error deleting webhook:', error);
  }
}

export const WebhookSignatureKey: {
  [key: string]: { name: string; url: string; signatureKey: string };
} = {};

export async function configWebhook(
  locationId: string,
  endpointName: string,
  publicServerUrl: string,
  events: string[],
) {
  const webhookName = `${locationId}--${endpointName}`;
  const webhookList = await listWebhooks();
  const webhook = webhookList?.subscriptions?.find(
    (subscription) => subscription.name === webhookName,
  );
  if (webhook?.id) {
    console.log(`Webhook ${webhookName} found #${webhook.id}, now deleting...`);
    await deleteWebhook(webhook.id);
  }
  console.log(`Webhook ${webhookName} now creating...`);
  const result = await createWebhook(
    webhookName,
    `${publicServerUrl}/webhook/${endpointName}`,
    events,
  );
  console.log(
    `Webhook ${webhookName} #${result?.subscription?.id} created successfully!`,
    result,
  );
  WebhookSignatureKey[webhookName] = {
    name: webhookName,
    url: result?.subscription?.notificationUrl || '',
    signatureKey: result?.subscription?.signatureKey || '',
  };
}

export function verifyWebhookMiddlewareGenerator(webhookName: string) {
  return (req, res, next) => {
    // Local Bypass
    const ip = req.ip;
    if (isIpLocal(ip)) {
      req.body = JSON.parse(req.body.toString('utf-8'));
      next();
      return;
    }

    const body = req.body;
    const signature = req.headers['x-square-hmacsha256-signature'];
    const signatureKey = WebhookSignatureKey[webhookName]?.signatureKey;
    const url = WebhookSignatureKey[webhookName]?.url;
    console.log('Webhook verification: ', body, signature, signatureKey, url);
    if (
      WebhooksHelper.isValidWebhookEventSignature(
        body,
        signature,
        signatureKey,
        url,
      )
    ) {
      req.body = JSON.parse(req.body.toString('utf-8'));
      next();
      return;
    }
    console.log('Error: webhook request is not from Square POS');
    res.status(401).send({ error: 'Not from Square POS' });
  };
}

export async function getSquareOrder(orderId: string) {
  const orderApi = client.ordersApi;
  try {
    const {
      result: { order },
    } = await orderApi.retrieveOrder(orderId);
    console.log(`Order ${orderId} received: `, order);
    return order;
  } catch (error) {
    console.error(`Error getting oreder ${orderId}: `, error);
  }
}

export async function updateSquareOrderReference(
  order: Order,
  reference: string,
) {
  const orderApi = client.ordersApi;
  const orderId = order.id!;
  const locationId = order.locationId!;
  const version = order.version!;
  try {
    const {
      result: { order },
    } = await orderApi.updateOrder(orderId, {
      order: {
        locationId,
        referenceId: reference,
        ticketName: reference,
        version,
      },
    });
    console.log(`Order ${orderId} updated: `, order);
    return order;
  } catch (error) {
    console.error(`Error getting order ${orderId}: `, error);
  }
}

export async function getSquareOrders(count: number = 50) {
  const orderApi = client.ordersApi;
  try {
    const {
      result: { orders },
    } = await orderApi.searchOrders({
      limit: count,
      locationIds: [config.LOCATION_ID!],
      query: { sort: { sortField: 'CREATED_AT', sortOrder: 'DESC' } },
      returnEntries: false,
    });
    console.log(`${count} orders received: `);
    return orders;
  } catch (error) {
    console.error(`Error getting orders: `, error);
  }
}

export async function getSquareTodayOrders(count: number = 50) {
  const orderApi = client.ordersApi;
  try {
    const {
      result: { orders },
    } = await orderApi.searchOrders({
      limit: count,
      locationIds: [config.LOCATION_ID!],
      query: {
        filter: {
          dateTimeFilter: {
            createdAt: { startAt: moment().tz('Australia/Sydney').startOf('day').format('YYYY-MM-DDTHH:mm:ssZ') },
          },
        },
        sort: { sortField: 'CREATED_AT', sortOrder: 'DESC' },
      },
      returnEntries: false,
    });
    console.log(`Today ${count} orders received: `);
    return orders;
  } catch (error) {
    console.error(`Error getting orders: `, error);
  }
}

export function mapOrderToReceiptData(
  order?: Order,
  index?: number,
): ReceiptData {
  const date = new Date(order?.createdAt!);
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
    id: `${order.tenders?.map((tender) => tender.id?.slice(0, 4) || '')} - ${(order.id || '').slice(0, 5)}`,
    index: index || -1,
    date,
    lineItems:
      (order.lineItems || []).map((line) => ({
        name: line.name || '',
        quantity: parseInt(line.quantity || '0'),
        price: (Number(line.totalMoney?.amount || 0) / 100).toFixed(2),
        description: `${line.variationName} ${(line.modifiers || []).map((m) => m?.name).join(' ')} ${line.note || ''}`,
      })) || [],
    surcharges: (order.serviceCharges || []).map((charge) => ({
      name: charge.name || '',
      price: (Number(charge.appliedMoney?.amount || '0') / 100).toFixed(2),
    })),
    discounts: (order.discounts || []).map((discount) => ({
      name: discount.name || '',
      price: (Number(discount.appliedMoney?.amount || 0) / 100).toFixed(2),
    })),
    totals: (Number(order.totalMoney?.amount || 0) / 100).toFixed(2),
  };
}
