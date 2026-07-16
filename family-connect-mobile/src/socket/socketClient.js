import { io } from 'socket.io-client';
import { API_ORIGIN } from '../services/api';

let socket = null;
let activeToken = null;
const locationListeners = new Set();

// Generic relay for additional real-time events (zone alerts, SOS,
// safe-zone changes...) — mirrors the location relay pattern.
const eventListeners = new Map(); // event name -> Set<callback>
const attachedEvents = new Set();

function relayEvent(event, payload) {
  const set = eventListeners.get(event);
  if (!set) return;
  set.forEach((cb) => {
    try {
      cb(payload);
    } catch {
      /* listener error */
    }
  });
}

function attachEventRelay(sock, event) {
  if (!sock || attachedEvents.has(event)) return;
  attachedEvents.add(event);
  sock.on(event, (payload) => relayEvent(event, payload));
}

/**
 * Subscribe to any server-emitted socket event
 * (e.g. 'zone_alert', 'sos_alert', 'safezones_changed').
 * @returns {() => void} unsubscribe
 */
export function subscribeSocketEvent(event, callback) {
  if (!eventListeners.has(event)) eventListeners.set(event, new Set());
  eventListeners.get(event).add(callback);
  if (socket) attachEventRelay(socket, event);
  return () => eventListeners.get(event)?.delete(callback);
}

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
  eventListeners.forEach((_set, event) => attachEventRelay(socket, event));

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
    attachedEvents.clear();
    socket.disconnect();
    socket = null;
    activeToken = null;
  }
}
