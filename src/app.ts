import { join } from 'path';
import AutoLoad, { AutoloadPluginOptions } from 'fastify-autoload';
import { FastifyPluginAsync } from 'fastify';
import fmongo from 'fastify-mongodb'
import fastifyJwt from 'fastify-jwt'
import { Static, Type } from "@sinclair/typebox";
import Ajv from 'ajv'

import AuthService from './routes/auth/service';

export type AppOptions = {} & Partial<AutoloadPluginOptions>;

// This is the "init" function: here there's the set up
const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  // Configuration validation:
  // 1. create instance of AJV (which validates the environment)
  // 2. create the object `env` for using process.env AND the opts (useful for testing)
  // 3. validate the configuration
  // 3.a the configuration is not valid: launch error. This stop the application start up!!
  // 3.b the configuration is valid: we can use later
  const ajv = new Ajv().addKeyword('kind').addKeyword('modifier')
  const validateConfiguration = ajv.compile(CloudStoreConf)
  const env = { ...process.env, ...opts }
  if (!validateConfiguration(env)) {
    fastify.log.error('Invalid configuration', { errors: validateConfiguration.errors, opts: env })
    throw new Error('Invalid configuration')
  }

  // We need to use mongo for storing `Cart` somewhere
  // the mongodb driver (behind `fastify-mongo`) handles the connection pool automatically for us
  // and closes inactive ones after a while
  await fastify.register(fmongo, {
    forceClose: true,
    url: env.MONGODB_URL
  }).after()

  // We need to use JWT for knowing user are making the request, identifying it
  // and making some checks
  // for example, only `admin` users can create `Cart` (strange BusinessRule as always :) )
  // or to be sure that only the "current" user can access (read or write) to the `Cart`
  fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET
  })
  // It is common to share `AuthService` through all routes/plugin
  // in this way, you can access to this instance through `fastify.authService` or
  // `this.authService` inside the handlers
  const service = new AuthService()
  fastify.decorate('authService', service)

  // Common useful stuff like this.httpErrors.*
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts
  })

  // Load automatically all files and folders inside routes
  // In this way, all routes are automatically registered
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: opts
  })

};

export default app;
export { app }

// Because the JWT has a `payload`, we need to define which model the payload is
declare module "fastify-jwt" {
  interface FastifyJWT {
    payload: JWTPayload
  }
}

// Because we want to use `authService` through fastify and for typescript,
// we need to externs the definition in the following way
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
