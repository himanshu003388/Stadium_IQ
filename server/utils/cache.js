import NodeCache from 'node-cache';

export const queryCache = new NodeCache({ stdTTL: 300, checkperiod: 60, maxKeys: 1000 });
