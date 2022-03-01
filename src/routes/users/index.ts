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

    fastify.get<{ Params: UsernameParams; Reply: CartDTOType }>('/:username/cart', {
        schema: {
            response: {
                200: CartDTO,
            },
        },
    }, async function (request, reply) {
        const username = request.params.username
        const user = request.user

        if (username !== user.sub) {

            throw this.httpErrors.unauthorized('No user found')
        }

        const cart = await service.getCart(request.log, username)

        return cart
    })

    fastify.put<{ Params: UsernameParams, Body: ProductDTOType; Reply: CartDTOType }>('/:username/cart/products', {
        schema: {
            body: ProductDTO,
            response: {
                200: CartDTO,
            },
        },
    }, async function (request, reply) {
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