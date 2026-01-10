import { Message } from '../../models/Message';
import { Conversation } from '../../models/Conversation';

export async function sendMessageService(input: {
  fromUserId: string;
  toUserId: string;
  content: string;
}) {
  const { fromUserId, toUserId, content } = input;

  const message = await Message.create({
    from: fromUserId,
    to: toUserId,
    content,
    read: false,
  });

  await message.populate('from', 'name username');
  await message.populate('to', 'name username');

  const participants = [fromUserId, toUserId].sort();

  let conversation = await Conversation.findOne({ participants });

  if (conversation) {
    conversation.lastMessage = message._id;
    conversation.lastMessagePreview = content.substring(0, 100);
    conversation.lastMessageAt = new Date();
    await conversation.save();
  } else {
    conversation = await Conversation.create({
      participants,
      lastMessage: message._id,
      lastMessagePreview: content.substring(0, 100),
      lastMessageAt: new Date(),
    });
  }

  return { message, conversation };
}
