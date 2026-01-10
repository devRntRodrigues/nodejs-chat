const onlineUsers = new Map<string, Set<string>>();

export function addUserSocket(userId: string, socketId: string): boolean {
  const sockets = onlineUsers.get(userId);

  if (!sockets) {
    onlineUsers.set(userId, new Set([socketId]));
    return true;
  }

  sockets.add(socketId);
  return false;
}

export function removeUserSocket(userId: string, socketId: string): boolean {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return false;

  sockets.delete(socketId);

  if (sockets.size === 0) {
    onlineUsers.delete(userId);
    return true;
  }

  return false;
}

export function getOnlineUserIds(): string[] {
  return Array.from(onlineUsers.keys());
}
