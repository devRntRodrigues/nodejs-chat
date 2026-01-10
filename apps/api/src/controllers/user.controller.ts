import { getCurrentUserById, getAllUsersExcept } from '../services/user.service';
import { asyncHandler } from '../utils/asyncHandler';
import { requireUserId } from '../utils/authUser';

export const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);

  const user = await getCurrentUserById(userId);

  res.json({ user });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const currentUserId = requireUserId(req);

  const users = await getAllUsersExcept(currentUserId);

  res.json({ users });
});
