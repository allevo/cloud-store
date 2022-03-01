// This file contains code that we reuse between our tests.
import Fastify from 'fastify'
import fp from 'fastify-plugin'
import App from '../src/app'
import * as tap from 'tap';

export type Test = typeof tap['Test']['prototype'];

// Fill in this config with all the configurations
// needed for testing the application
async function config() {
  const dbName = 'test-' + `${Math.random()}`.split('.')[1]
  return {
    MONGODB_URL: 'mongodb://localhost/' + dbName,
    JWT_SECRET: 'supersecret',
  }
}

// Automatically build and tear down our instance
async function build(t: Test) {
  const app = Fastify()

  // fastify-plugin ensures that all decorators
  // are exposed for testing purposes, this is
  // different from the production setup
  void app.register(fp(App), await config() as any)

  await app.ready();

  // Tear down our app after we are done
  t.teardown(() => void app.close())

  return app
}

export {
  config,
  build
}
