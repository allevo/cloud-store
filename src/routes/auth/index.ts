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

    // We want to expose a POST /auth/login
    // forcing typescript to recognize which request and reply body we have here
    // The following line define *ONLY* typescript types, doesn't make the validation!!
    fastify.post<{ Body: FindCredentialArgumentType; Reply: ResponseType }>('/login', {
        // Instead, the following lines define the validation and serialization
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
    // This API returns just something like { token: 'my-jwt-token' }
    // For doing this, we need to:
    // 1. get the request body (already validated by fastify because of `schema.body` option)
    // 2. invoke `authService` for knowing if the credentials are OK or not
    //    NB: `this.authService` is valid because:
    //    a. line 13 we checked it
    //    b. `app.ts` decorates fastify with authService
    //    c. `app.ts` extends fastify model in typescript definition
    // 3. check if the method returns a valid `userProfile`
    // 3.a if it is not valid: throw an error
    // 3.b build JWT and return it
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
