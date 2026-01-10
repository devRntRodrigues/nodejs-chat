import { Message } from '../../models/Message';

type BySender = Array<{ senderId: string; messageIds: string[] }>;

export async function markMessagesReadService(input: { userId: string; messageIds: string[] }) {
  const { userId, messageIds } = input;

  const result = await Message.updateMany(
    { _id: { $in: messageIds }, to: userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );

  if (result.modifiedCount === 0) {
    const bySender: BySender = [];
    return { modifiedCount: 0, bySender };
  }

  const messages = await Message.find({ _id: { $in: messageIds }, to: userId }).select('from _id');

  const map = new Map<string, string[]>();
  for (const msg of messages) {
    const senderId = msg.from.toString();
    const list = map.get(senderId) ?? [];
    list.push(msg._id.toString());
    map.set(senderId, list);
  }

  const bySender: BySender = Array.from(map.entries()).map(([senderId, ids]) => ({
    senderId,
    messageIds: ids,
  }));

  return { modifiedCount: result.modifiedCount, bySender };
}
