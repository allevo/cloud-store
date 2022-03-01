import { FastifyPluginAsync } from 'fastify'
import CartService, { CartDTO, CartDTOType, ProductDTO, ProductDTOType } from './service'

// Proposta 2*
// GET / users / : username / cart
// PUT / users / : username / cart / products

const carts: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    if (!fastify.mongo) {
        throw new Error('Invalid setup: mongo plugin not configured correctly')
    }
    if (!fastify.authService) {
        throw new Error('Invalid setup: authService not configured correctly')
    }

    const db = fastify.mongo.db!
    const service = new CartService(db)

    fastify.addHook("onRequest", async (request, reply) => {
        try {
            await request.jwtVerify()
        } catch (err) {
            reply.send(err)
        }
    })

    // We want to expose a POST /auth/login
    // forcing typescript to recognize which request and reply body we have here
    // The following line define *ONLY* typescript types, doesn't make the validation!!
    fastify.get<{ Params: UsernameParams; Reply: CartDTOType }>('/:username/cart', {
        // Instead, the following lines define the validation and serialization
        schema: {
            response: {
                200: CartDTO,
            },
        },
    }, async function (request, reply) {
        // We want to return the current cart of the `username` user
        // For doing it, we need to:
        // 1. extrapolate the url params (`:username` means that you can specify the username in the *path*)
        // 2. extrapolate the "current" logged user. thankfully to `fastify-jwt` and the "onRequest" hook
        //    the `JWTPayload` model lives inside `request.user`
        // 3. checks if the current user is asking for own cart
        // 3.a if the check fails: thrown an error unauthorized
        // 3.b otherwise you can ask to the service and return it
        const username = request.params.username
        const user = request.user

        if (username !== user.sub) {
            throw this.httpErrors.unauthorized('No user found')
        }

        const cart = await service.getCart(request.log, username)

        return cart
    })

    // We want to expose a POST /auth/login
    // forcing typescript to recognize which request and reply body we have here
    // The following line define *ONLY* typescript types, doesn't make the validation!!
    fastify.put<{ Params: UsernameParams, Body: ProductDTOType; Reply: CartDTOType }>('/:username/cart/products', {
        // Instead, the following lines define the validation and serialization
        schema: {
            body: ProductDTO,
            response: {
                200: CartDTO,
            },
        },
    }, async function (request, reply) {
        // We want to update the current cart of the `username` user
        // For doing it, we need to:
        // 1. extrapolate the url params (`:username` means that you can specify the username in the *path*)
        // 2. extrapolate the "current" logged user. thankfully to `fastify-jwt` and the "onRequest" hook
        //    the `JWTPayload` model lives inside `request.user`
        // 3. check is the user is able to make this action:
        // 3.a if the check fails: thrown an error unauthorized
        // 3.b if the user is not an admin: thrown an error forbidden
        // 3.c otherwise add the product to the chat and return the new cart to the requester

        const username = request.params.username
        const user = request.user

        if (username !== user.sub) {
            throw this.httpErrors.unauthorized('Not allowed to updated cart belonged to other user')
        }
        if (!(user.groups.includes('admin'))) {
            throw this.httpErrors.forbidden('Only admin can add product to own cart')
        }

        const cart = await service.addProductToCart(request.log, username, request.body)
        return cart
    })
}

export default carts;

interface UsernameParams {
    username: string
}