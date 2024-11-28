import config from '../config';
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert(config.GOOGLE_FIREBASE_KEY),
});

const db = admin.firestore();

export async function addOrderReference(orderId: string) {
  const orderAutoIndexDoc = await db
    .collection('configs')
    .doc('orderAutoIndex');
  const order = await db.runTransaction(async (transaction) => {
    const orderAutoIndex = await transaction.get(orderAutoIndexDoc);
    const orderAutoIndexData = orderAutoIndex.data();
    if (!orderAutoIndexData) {
      throw new Error('Error: no orderAutoIndex configuration found!');
    }
    transaction.set(orderAutoIndexDoc, { value: orderAutoIndexData.value + 1 });
    const newOrder = db.collection('orders').doc(orderId);
    transaction.set(newOrder, {
      index: orderAutoIndexData.value + 1,
    });
    console.log(
      `Add order ${orderId} with index ${orderAutoIndexData.value + 1}`,
    );
    return newOrder;
  });
  return { id: orderId, index: (await order.get())?.data()?.index };
}

export async function getOrderById(orderId: string) {
  return (await db.collection('orders').doc(orderId).get()).data();
}

export async function getLastOrders(count: number = 50) {
  return (
    await db.collection('orders').orderBy('index', 'desc').limit(count).get()
  ).docs.map((doc) => ({ id: doc.id, index: doc.data()?.index }));
}
