import { Static, Type } from '@sinclair/typebox';
import { FastifyPluginAsync } from 'fastify'
import fastifyJwt from 'fastify-jwt'
import AuthService, { FindCredentialArgument, FindCredentialArgumentType } from './service'


declare module "fastify-jwt" {
    interface FastifyJWT {
        payload: JWTPayload
    }
}

interface JWTPayload {
    sub: string,
    name: string,
    groups: string[],
}

const Response = Type.Object({
    token: Type.String(),
})
type ResponseType = Static<typeof Response>;


const auth: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    fastify.register(fastifyJwt, {
        secret: 'supersecret'
    })

    const service = new AuthService();

    fastify.post<{ Body: FindCredentialArgumentType; Reply: ResponseType }>('/login', {
        schema: {
            body: FindCredentialArgument,
            response: {
                200: Response,
            },
        },
    }, async function (request, reply) {
        const body = request.body

        const userProfile = await service.findCredentials(body)

        if (!userProfile) {
            throw fastify.httpErrors.forbidden('No user found')
        }

        const token = await reply.jwtSign({
            sub: `${userProfile.id}`,
            name: `${userProfile.name} ${userProfile.surname}`,
            groups: userProfile.groups,
        });

        return { token }
    })
}

export default auth;
