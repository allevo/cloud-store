import { FastifyPluginAsync } from 'fastify'
import ProductService, { ProductFilter, ProductFilterType, ProductList, ProductListType } from './service';


const products: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    const service = new ProductService();

    // We want to expose a GET /products or GET /products/
    // forcing typescript to recognize which request and reply body we have here
    // The following line define *ONLY* typescript types, doesn't make the validation!!
    fastify.get<{ Querystring: ProductFilterType; Reply: ProductListType }>('/', {
        // Instead, the following lines define the validation and serialization
        schema: {
            querystring: ProductFilter,
            response: {
                200: ProductList,
            },
        },
    }, async function (request, reply) {
        const filter = request.query

        const products = await service.getProducts(request.log, filter)

        return products
    })
}

export default products;
