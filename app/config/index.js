const env = process.env.NODE_ENV ?? 'development';

const config = {
  env,
  isDev: env === 'development',
  server: {
    port: Number(process.env.PORT ?? 3000),
    host: process.env.HOST ?? '0.0.0.0'
  },
  features: {
    // Ejemplo de feature flag: habilita métricas en tiempo real
    realtimeMetrics: env !== 'test'
  }
};

export default config;

