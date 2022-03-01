import { join } from 'path';
import AutoLoad, { AutoloadPluginOptions } from 'fastify-autoload';
import { FastifyPluginAsync } from 'fastify';
import fmongo from 'fastify-mongodb'
import fastifyJwt from 'fastify-jwt'
import { Static, Type } from "@sinclair/typebox";
import Ajv from 'ajv'

import AuthService from './routes/auth/service';

export type AppOptions = {} & Partial<AutoloadPluginOptions>;

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  const ajv = new Ajv().addKeyword('kind').addKeyword('modifier')
  const validateConfiguration = ajv.compile(CloudStoreConf)
  const env = { ...process.env, ...opts }
  if (!validateConfiguration(env)) {
    fastify.log.error('Invalid configuration', { errors: validateConfiguration.errors, opts: env })
    throw new Error('Invalid configuration')
  }

  await fastify.register(fmongo, {
    forceClose: true,
    url: env.MONGODB_URL
  }).after()

  fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET
  })
  const service = new AuthService()
  fastify.decorate('authService', service)

  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts
  })

  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: opts
  })

};

export default app;
export { app }

declare module "fastify-jwt" {
  interface FastifyJWT {
    payload: JWTPayload
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authService: AuthService,
  }
}

interface JWTPayload {
  sub: string,
  name: string,
  groups: string[],
}


export const CloudStoreConf = Type.Object({
  MONGODB_URL: Type.String(),
  JWT_SECRET: Type.String(),
})
export type CloudStoreConfType = Static<typeof CloudStoreConf>;
