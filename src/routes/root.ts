import { FastifyPluginAsync } from 'fastify'

// Just an example, not used at all
const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/', async function (request, reply) {
    return { root: true }
  })
}

export default root;
