function canJoinRoom(socket, room) {
  if (typeof room !== 'string' || room.length > 100) return false;
  // Only public auction rooms, the caller's user room and staff room are supported.
  if (room === 'general' || /^auction_[a-f\d]{24}$/i.test(room)) return true;
  if (!socket.isAuthenticated) return false;
  if (room === 'admin_room') return ['admin', 'super_admin'].includes(socket.user?.role);
  return room === `user_${socket.user?.userId || socket.user?.id}`;
}
module.exports = { canJoinRoom };
