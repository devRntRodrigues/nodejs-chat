import {
  getUnreadCounts,
  getConversationsWithUnread,
  getMessagesBetweenUsers,
} from '../services/message.service';
import { asyncHandler } from '../utils/asyncHandler';
import { requireUserId } from '../utils/authUser';
import { ok } from '../utils/http';
import { validatedParams, validatedQuery } from '../utils/validated';
import { getMessagesParamsSchema, getMessagesQuerySchema } from '../schemas/message.schema';

export const getUnreadCountsController = asyncHandler(async (req, res) => {
  const currentUserId = requireUserId(req);

  const unreadCounts = await getUnreadCounts(currentUserId);

  ok(res, { unreadCounts });
});

export const getConversations = asyncHandler(async (req, res) => {
  const currentUserId = requireUserId(req);

  const conversations = await getConversationsWithUnread(currentUserId);

  ok(res, { conversations });
});

export const getMessages = asyncHandler(async (req, res) => {
  const currentUserId = requireUserId(req);

  const { userId } = validatedParams(req, getMessagesParamsSchema);
  const { limit, cursor } = validatedQuery(req, getMessagesQuerySchema);

  const { messages, nextCursor } = await getMessagesBetweenUsers(
    currentUserId,
    userId,
    limit,
    cursor
  );

  ok(res, { messages }, { nextCursor, limit });
});
