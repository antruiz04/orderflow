import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createProxyMiddleware } from 'http-proxy-middleware';

type ProxyRoute = {
  pathFilter: string;
  envKey: string;
};

const ROUTES: ProxyRoute[] = [
  { pathFilter: '/auth', envKey: 'AUTH_BASE_URL' },
  { pathFilter: '/api', envKey: 'CATALOG_BASE_URL' },
  { pathFilter: '/orders', envKey: 'ORDERS_BASE_URL' },
  { pathFilter: '/stock', envKey: 'INVENTORY_BASE_URL' },
];

export function setupProxies(app: INestApplication): void {
  const config = app.get(ConfigService);
  const expressApp = app.getHttpAdapter().getInstance();
  const logger = new Logger('Proxy');

  for (const route of ROUTES) {
    const target = config.getOrThrow<string>(route.envKey);
    expressApp.use(
      createProxyMiddleware({
        target,
        changeOrigin: true,
        pathFilter: route.pathFilter,
      }),
    );
    logger.log(`${route.pathFilter} → ${target}`);
  }
}
