import { io } from 'socket.io-client';
import { API_ORIGIN } from '../services/api';

let socket = null;
let activeToken = null;
const locationListeners = new Set();

const SOCKET_OPTIONS = {
  transports: ['websocket'],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
};

function relayLocationUpdate(payload) {
  locationListeners.forEach((cb) => {
    try {
      cb(payload);
    } catch {
      /* listener error */
    }
  });
}

function attachLocationRelay(sock) {
  if (!sock || sock._locationRelayAttached) return;
  sock._locationRelayAttached = true;
  sock.on('location_update', relayLocationUpdate);
}

/**
 * Subscribe to live `location_update` socket events.
 * @param {(payload: object) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeLocationUpdate(callback) {
  locationListeners.add(callback);
  if (socket) attachLocationRelay(socket);
  return () => locationListeners.delete(callback);
}

/**
 * Return the singleton socket instance (may be disconnected).
 */
export function getSocket() {
  return socket;
}

/**
 * Connect (or reconnect) the socket with a JWT.
 */
export function connectSocket(token) {
  if (!token) {
    throw new Error('Socket requires an auth token');
  }

  if (socket && activeToken !== token) {
    socket.disconnect();
    socket = null;
    activeToken = null;
  }

  if (!socket) {
    socket = io(API_ORIGIN, {
      ...SOCKET_OPTIONS,
      auth: { token },
    });
    activeToken = token;
  } else {
    socket.auth = { ...socket.auth, token };
    activeToken = token;
  }

  attachLocationRelay(socket);

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

/**
 * Disconnect and tear down the singleton socket.
 */
export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket._locationRelayAttached = false;
    socket.disconnect();
    socket = null;
    activeToken = null;
  }
}
