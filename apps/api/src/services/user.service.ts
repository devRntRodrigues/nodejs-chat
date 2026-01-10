import { User } from '../models/User';
import { NotFoundError } from '../utils/errors';

export async function getCurrentUserById(userId: string) {
  const user = await User.findById(userId).lean();

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getAllUsersExcept(currentUserId: string) {
  const users = await User.find({
    _id: { $ne: currentUserId },
  })
    .select('_id name username createdAt lastSeen')
    .sort({ name: 1 })
    .lean();

  return users;
}
