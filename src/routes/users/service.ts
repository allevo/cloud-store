import { Static, Type } from "@sinclair/typebox";
import { FastifyLoggerInstance } from "fastify";
import { Collection, Db, ReturnDocument } from "mongodb";

export default class CartService {
    // `Collection` comes from `mongo` directly and it is typed!
    // MongoDB is a document DB. So, that means you can store a "complex" data like inner array of object as we do
    // In fact `CartEntityType` contains array of `ProductEntity`, strings and dates (not string, dates)
    collection: Collection<CartEntityType>;

    constructor(db: Db) {
        this.collection = db.collection<CartEntityType>('carts')
    }

    async getCart(log: FastifyLoggerInstance, username: string): Promise<CartDTOType> {
        log.info('Find cart of user', { username })

        // the query system uses document (something like JSON) for matching documents
        // Our business asks us to store just a `Cart` for user, so we can use the `username`
        // for finding the correct document
        const userCart = await this.collection.findOne({ username })

        // TODO: what we want to do if the `Cart` is not yet created for this user?
        // Probably throwing an error is not so OK...
        if (!userCart) {
            log.warn('Cart not found')
            throw new Error('Cart not found')
        }

        log.trace('Cart found', { char: userCart })

        // Because we don't want to use the same model for DB entity and DTO, we need to map it
        return this.map(userCart)
    }

    async addProductToCart(log: FastifyLoggerInstance, username: string, product: ProductDTOType): Promise<CartDTOType> {
        log.info('Add product to cart', { username, productId: product.id })

        // We want to add a product inside the DB but we don't know *if* the user already has one or not
        // `upsert` option allow to make an *up*date if the `Cart` already be inside the DB or an in*sert* if not
        // This is made not atomically (at mongodb side), so probably we need to create an unique index in order to avoid duplicates
        // Anyway, for making this upsert logic we need to invoke the below method using the right options
        // https://docs.mongodb.com/manual/reference/method/db.collection.findOneAndUpdate/


        const now = new Date()
        const userCartResult = await this.collection.findOneAndUpdate({ username }, {
            // https://docs.mongodb.com/manual/reference/operator/update/setOnInsert/
            $setOnInsert: { username, insertDate: now },
            // https://docs.mongodb.com/manual/reference/operator/update/push/
            $push: { products: product },
            // https://docs.mongodb.com/manual/reference/operator/update/set/
            $set: { updateDate: now },
        }, {
            // https://docs.mongodb.com/manual/reference/method/db.collection.findOneAndUpdate/#update-document-with-upsert
            upsert: true,
            // upsert ok, but we want also to return the new `Cart`
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
