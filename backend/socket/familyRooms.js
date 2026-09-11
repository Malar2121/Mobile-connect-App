const User = require('../models/User');
const { resolveFamilyAccess } = require('../services/accessPolicy');
const logger = require('../utils/logger');

const userRoom = (userId) => `user_${userId}`;
const familyRoom = (familyId) => `family_${familyId}`;

/** The part of an access decision that is safe to send to the client. */
const publicAccess = (access) => ({
  canRead: Boolean(access?.canRead),
  canWrite: Boolean(access?.canWrite),
  code: access?.code ?? null,
});

/**
 * Put a user's open sockets in the family room their current access allows,
 * and in no other family room.
 *
 * Call this after anything that changes membership or consent — joining,
 * leaving, a guardian decision, a member-type change — so real-time delivery
 * follows the same rules as the REST API immediately, instead of waiting for
 * the app to reconnect.
 */
async function syncUserFamilyRoom(io, userId) {
  if (!io || !userId) return;

  try {
    const sockets = await io.in(userRoom(userId)).fetchSockets();
    if (sockets.length === 0) return;

    const user = await User.findById(userId).select('familyId role memberType isActive');
    const access = user && user.isActive
      ? await resolveFamilyAccess(user)
      : { canRead: false, canWrite: false, code: 'NO_FAMILY' };
    const target = access.canRead ? familyRoom(user.familyId) : null;

    for (const socket of sockets) {
      for (const room of socket.rooms) {
        if (room.startsWith('family_') && room !== target) socket.leave(room);
      }
      if (target) socket.join(target);

      socket.data.familyId = user?.familyId ? String(user.familyId) : null;
      socket.data.access = access;
      socket.emit('family_access', publicAccess(access));
    }
  } catch (err) {
    logger.error(`syncUserFamilyRoom error: ${err.message}`);
  }
}

module.exports = { syncUserFamilyRoom, userRoom, familyRoom, publicAccess };
