import { Static, Type } from "@sinclair/typebox";
import { FastifyLoggerInstance } from "fastify";
import { Collection, Db, ReturnDocument } from "mongodb";

export default class CartService {
    collection: Collection<CartEntityType>;

    constructor(db: Db) {
        this.collection = db.collection<CartEntityType>('carts')
    }

    async getCart(log: FastifyLoggerInstance, username: string): Promise<CartDTOType> {
        log.info('Find cart of user', { username })
        const userCart = await this.collection.findOne({ username })

        if (!userCart) {
            log.warn('Cart not found')
            throw new Error('Cart not found')
        }

        log.trace('Cart found', { char: userCart })

        return this.map(userCart)
    }

    async addProductToCart(log: FastifyLoggerInstance, username: string, product: ProductDTOType): Promise<CartDTOType> {
        log.info('Add product to cart', { username, productId: product.id })

        const now = new Date()
        const userCartResult = await this.collection.findOneAndUpdate({ username }, {
            $setOnInsert: { username, insertDate: now },
            $push: { products: product },
            $set: { updateDate: now },
        }, {
            upsert: true,
            returnDocument: ReturnDocument.AFTER,
        })
        const userCart = userCartResult.value!

        return this.map(userCart)
    }

    private map(entity: CartEntityType): CartDTOType {
        return {
            ...entity,
            insertDate: entity.insertDate.toISOString(),
            updateDate: entity.updateDate.toISOString(),
            // ProductEntity and ProductDTO are equals
            // products: entity.products.map(p => { return p })
        }
    }
}

export const ProductDTO = Type.Object({
    id: Type.Number(),
    title: Type.String(),
    price: Type.Number(),
    description: Type.String(),
})
export type ProductDTOType = Static<typeof ProductDTO>;

export const CartDTO = Type.Object({
    username: Type.String(),
    insertDate: Type.String({ format: 'date' }),
    updateDate: Type.String({ format: 'date' }),
    products: Type.Array(ProductDTO),
})
export type CartDTOType = Static<typeof CartDTO>;

interface ProductEntityType {
    id: number,
    title: string,
    price: number,
    description: string,
}
interface CartEntityType {
    username: string,
    insertDate: Date,
    updateDate: Date,
    products: ProductEntityType[],
}
