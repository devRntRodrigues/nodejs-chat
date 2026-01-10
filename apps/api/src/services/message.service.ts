import mongoose from 'mongoose';
import { Message } from '../models/Message';
import { Conversation } from '../models/Conversation';
import { User } from '../models/User';
import { NotFoundError } from '../utils/errors';

export async function getUnreadCounts(userId: string): Promise<Record<string, number>> {
  const unreadMessages = await Message.aggregate([
    {
      $match: {
        to: userId,
        read: false,
      },
    },
    {
      $group: {
        _id: { $toString: '$from' },
        count: { $sum: 1 },
      },
    },
  ]);

  const unreadCounts: Record<string, number> = {};
  unreadMessages.forEach((item) => {
    unreadCounts[item._id.toString()] = item.count;
  });

  return unreadCounts;
}

export async function getConversationsWithUnread(userId: string) {
  const conversations = await Conversation.find({
    participants: userId,
  })
    .sort({ lastMessageAt: -1 })
    .populate('participants', 'name username')
    .populate('lastMessage')
    .lean();

  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conv) => {
      const otherParticipant = conv.participants.find(
        (p: { _id: mongoose.Types.ObjectId }) => p._id.toString() !== userId.toString()
      );

      const unreadCount = await Message.countDocuments({
        from: otherParticipant?._id,
        to: userId,
        read: false,
      });

      return {
        ...conv,
        unreadCount,
      };
    })
  );

  return conversationsWithUnread;
}

export async function getMessagesBetweenUsers(currentUserId: string, otherUserId: string) {
  if (!otherUserId || !mongoose.Types.ObjectId.isValid(otherUserId)) {
    throw new NotFoundError('User ID is required');
  }

  const otherUser = await User.findById(otherUserId);
  if (!otherUser) {
    throw new NotFoundError('User not found');
  }

  const messages = await Message.find({
    $or: [
      { from: currentUserId, to: otherUserId },
      { from: otherUserId, to: currentUserId },
    ],
  })
    .sort({ createdAt: 1 })
    .populate('from', 'name username')
    .populate('to', 'name username')
    .lean();

  return messages;
}
