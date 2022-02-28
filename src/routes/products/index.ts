import { FastifyPluginAsync } from 'fastify'
import ProductService, { ProductFilter, ProductFilterType, ProductList, ProductListType } from './service';


const products: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    const service = new ProductService();

    fastify.get<{ Querystring: ProductFilterType; Reply: ProductListType }>('/', {
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
