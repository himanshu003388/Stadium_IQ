import { WebSocketServer } from 'ws';
import { verifyToken } from './jwt.js';
import logger from './logger.js';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let wss = null;
let state = null;
let simulationInterval = null;

// Resolve mockContext.json path relative to this file
const mockContextPath = path.resolve(__dirname, '../../src/data/mockContext.json');
try {
  state = JSON.parse(fs.readFileSync(mockContextPath, 'utf8'));
} catch (e) {
  logger.error('Failed to load initial mock context', e);
}

// Simulation constants matching the frontend
const SIMULATION_CONFIG = {
  MIN_OCCUPANCY: 80000,
  OCCUPANCY_DELTA: 200,
  DENSITY_DELTA: 0.04,
  DENSITY_BIAS: 0.48,
  DENSITY_LOOKAHEAD: 0.12,
  CRITICAL_THRESHOLD: 0.85,
  WATCH_THRESHOLD: 0.65,
  WAIT_TIME_COEFFICIENT: 30,
  TEMP_DELTA: 0.5,
  TEMP_MIN: 15,
  TEMP_MAX: 45,
  VENDOR_DEPLETION: 3,
};

export function initWebSocketServer(server) {
  wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    // 1. Origin validation
    const origin = request.headers.origin;
    const isProduction = process.env.NODE_ENV === 'production';

    // Whitelist check
    const allowedOrigins = isProduction
      ? process.env.ALLOWED_ORIGINS?.split(',') || []
      : ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3001'];

    if (isProduction && (!origin || !allowedOrigins.includes(origin))) {
      logger.warn(`[WS REJECTED] Invalid origin: ${origin}`);
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }

    // 2. Authentication handshake validation (utilizing short-lived JWT)
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const token = url.searchParams.get('token');

    if (!token) {
      logger.warn('[WS REJECTED] Missing authentication token');
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      logger.warn('[WS REJECTED] Invalid or expired JWT token');
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    // Handshake successful: upgrade the request
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws) => {
    logger.info('WebSocket client connected successfully');

    // Push initial state immediately on connection
    if (state) {
      ws.send(JSON.stringify({ type: 'STATE_UPDATE', data: state }));
    }

    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message);
        if (parsed.type === 'ACTION') {
          handleClientAction(parsed.action, parsed.payload);
        }
      } catch (err) {
        logger.error('Failed to parse WebSocket message from client', err);
      }
    });

    ws.on('close', () => {
      logger.info('WebSocket client disconnected');
    });
  });

  // Start telemetry simulation loop
  startServerSimulation();
}

function handleClientAction(action, payload) {
  if (!state) return;

  if (action === 'ASSIGN_VOLUNTEER') {
    const { taskId, volunteerId } = payload;
    state.tasks = state.tasks.map((t) =>
      t.id === taskId ? { ...t, assignedTo: volunteerId, status: 'in-progress' } : t,
    );
    state.volunteers = state.volunteers.map((v) =>
      v.id === volunteerId ? { ...v, currentLoad: Math.min(v.maxLoad, v.currentLoad + 1) } : v,
    );
  } else if (action === 'RESOLVE_TASK') {
    const { taskId } = payload;
    const task = state.tasks.find((t) => t.id === taskId);
    state.tasks = state.tasks.map((t) => (t.id === taskId ? { ...t, status: 'resolved' } : t));
    if (task) {
      state.volunteers = state.volunteers.map((v) =>
        v.id === task.assignedTo ? { ...v, currentLoad: Math.max(0, v.currentLoad - 1) } : v,
      );
    }
  } else if (action === 'RESOLVE_INCIDENT') {
    const { incidentId } = payload;
    state.incidents = state.incidents.map((i) =>
      i.id === incidentId ? { ...i, status: 'resolved' } : i,
    );
  } else if (action === 'TOGGLE_ECO_MODE') {
    const currentEco = state.stadium.sustainability.ecoModeActive;
    state.stadium.sustainability.ecoModeActive = !currentEco;
    state.stadium.sustainability.energyDrawMW = !currentEco
      ? parseFloat((state.stadium.sustainability.energyDrawMW * 0.78).toFixed(1))
      : parseFloat((state.stadium.sustainability.energyDrawMW / 0.78).toFixed(1));
  }

  // Broadcast the action outcome immediately
  broadcastState();
}

function startServerSimulation() {
  if (simulationInterval) clearInterval(simulationInterval);

  simulationInterval = setInterval(() => {
    if (!state) return;

    // Update gate densities
    state.gates = state.gates.map((gate) => {
      const delta = (Math.random() - 0.48) * SIMULATION_CONFIG.DENSITY_DELTA;
      const newDensity = Math.max(0.05, Math.min(0.99, gate.density + delta));
      const newWait = Math.max(1, Math.round(newDensity * SIMULATION_CONFIG.WAIT_TIME_COEFFICIENT));
      const newStatus =
        newDensity > SIMULATION_CONFIG.CRITICAL_THRESHOLD
          ? 'critical'
          : newDensity > SIMULATION_CONFIG.WATCH_THRESHOLD
            ? 'watch'
            : 'normal';
      const predictedDensity = parseFloat(
        Math.min(1.0, newDensity + SIMULATION_CONFIG.DENSITY_LOOKAHEAD).toFixed(2),
      );

      // Proactively broadcast alerts when density crosses boundaries
      if (newStatus === 'critical' && gate.status !== 'critical') {
        broadcastNotification({
          title: 'CRITICAL: Gate Congestion',
          message: `Gate ${gate.id} is at critical density (${Math.round(newDensity * 100)}%). AI recommends rerouting fans.`,
          severity: 'critical',
          duration: 10000,
        });
      }

      return {
        ...gate,
        density: parseFloat(newDensity.toFixed(2)),
        predictedDensity,
        waitTimeMinutes: newWait,
        status: newStatus,
      };
    });

    // Update occupancy
    state.stadium.currentOccupancy = Math.max(
      SIMULATION_CONFIG.MIN_OCCUPANCY,
      Math.min(
        state.stadium.capacity,
        state.stadium.currentOccupancy +
          Math.round((Math.random() - 0.5) * SIMULATION_CONFIG.OCCUPANCY_DELTA),
      ),
    );

    // Update vendors
    state.vendors = state.vendors.map((vendor) => {
      const depletion = Math.round(Math.random() * SIMULATION_CONFIG.VENDOR_DEPLETION);
      const newStock = Math.max(0, vendor.stockLevel - depletion);
      return {
        ...vendor,
        stockLevel: newStock,
        status: newStock < 20 ? 'critical' : newStock < 50 ? 'warning' : 'nominal',
      };
    });

    // Update weather
    const tempDelta = (Math.random() - 0.5) * SIMULATION_CONFIG.TEMP_DELTA;
    state.stadium.weather.temperature = parseFloat(
      Math.max(
        SIMULATION_CONFIG.TEMP_MIN,
        Math.min(SIMULATION_CONFIG.TEMP_MAX, (state.stadium.weather.temperature || 28) + tempDelta),
      ).toFixed(1),
    );
    state.stadium.weather.humidity = Math.max(
      20,
      Math.min(90, (state.stadium.weather.humidity || 50) + Math.round((Math.random() - 0.5) * 5)),
    );
    state.stadium.weather.conditions =
      state.stadium.weather.temperature > 35
        ? 'Hot'
        : state.stadium.weather.temperature < 20
          ? 'Cool'
          : 'Clear';

    // Broadcast updated state
    broadcastState();
  }, 4000);
}

function broadcastState() {
  if (!wss) return;
  const msg = JSON.stringify({ type: 'STATE_UPDATE', data: state });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      // OPEN
      client.send(msg);
    }
  });
}

function broadcastNotification(notification) {
  if (!wss) return;
  const msg = JSON.stringify({ type: 'NOTIFICATION', data: notification });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
}
