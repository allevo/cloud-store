import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance, FastifyLoggerInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { IncomingMessage, Server, ServerResponse } from 'http';
import { FindCredentialArgument, FindCredentialArgumentType } from './service'


const Response = Type.Object({
    token: Type.String(),
})
export type ResponseType = Static<typeof Response>;


const auth: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    if (!fastify.authService) {
        throw new Error('Invalid setup: authService not configured correctly')
    }

    fastify.post<{ Body: FindCredentialArgumentType; Reply: ResponseType }>('/login', {
        schema: {
            body: FindCredentialArgument,
            response: {
                200: Response,
            },
        },
    }, handleLogin)
}

async function handleLogin(
    this: FastifyInstance<Server, IncomingMessage, ServerResponse, FastifyLoggerInstance>,
    request: FastifyRequest<{ Body: FindCredentialArgumentType; Reply: ResponseType; }>,
    reply: FastifyReply<any, any, any, {
        Body: FindCredentialArgumentType;
        Reply: ResponseType;
    }>): Promise<ResponseType> {
    const body = request.body
    const userProfile = await this.authService.findCredentials(body)

    if (!userProfile) {
        throw this.httpErrors.forbidden('No user found')
    }

    const token = await reply.jwtSign({
        sub: `${userProfile.username}`,
        name: `${userProfile.name} ${userProfile.surname}`,
        groups: userProfile.groups,
    });

    return { token }
}

export default auth;
