import {
  getUnreadCounts,
  getConversationsWithUnread,
  getMessagesBetweenUsers,
} from '../services/message.service';
import { asyncHandler } from '../utils/asyncHandler';
import { requireUserId } from '../utils/authUser';

export const getUnreadCountsController = asyncHandler(async (req, res) => {
  const currentUserId = requireUserId(req);

  const unreadCounts = await getUnreadCounts(currentUserId);

  res.json({ unreadCounts });
});

export const getConversations = asyncHandler(async (req, res) => {
  const currentUserId = requireUserId(req);

  const conversations = await getConversationsWithUnread(currentUserId);

  res.json({ conversations });
});

export const getMessages = asyncHandler(async (req, res) => {
  const currentUserId = requireUserId(req);
  const { userId } = req.params;

  const messages = await getMessagesBetweenUsers(currentUserId, userId!);

  res.json({ messages });
});
