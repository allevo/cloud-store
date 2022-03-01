import { Static, Type } from "@sinclair/typebox";
import axios, { AxiosInstance } from 'axios'
import Ajv, { ValidateFunction } from 'ajv'
import { FastifyLoggerInstance } from "fastify";

interface CategoryIdToStringMap {
    [key: number]: string;
}
interface CategoryNameToIdMap {
    [key: string]: number;
}

const categoriesById: CategoryIdToStringMap = {
    1: 'electronics',
    2: 'jewelery',
    3: 'men\'s clothing',
    4: 'women\'s clothing',
}
const categoryIdsByCategory: CategoryNameToIdMap = {
    'electronics': 1,
    'jewelery': 2,
    'men\'s clothing': 3,
    'women\'s clothing': 4,
}

export default class ProductService {
    instance: AxiosInstance;
    validate: ValidateFunction;

    constructor() {
        // Axios allows us to create an instance with some common stuff, like baseURL and timeout
        this.instance = axios.create({
            baseURL: 'https://fakestoreapi.com/',
            timeout: 30000,
        });

        // Avoid to compile and creating a validation function every time
        // See below the reason
        const ajv = new Ajv().addKeyword('kind').addKeyword('modifier')
        this.validate = ajv.compile(FakeProductList)
    }

    async getProducts(log: FastifyLoggerInstance, { categoryId }: ProductFilterType): Promise<ProductListType> {
        // Unfortunatelly, fakestoreapi has not so really good API, so we want to do better:
        // depends on categoryId presence (or absence) we want to call behind different APIs
        // categoryId is number and we hardcoded the mapping between id and name (description)
        // In this way we abstract the bad design behind exposing just an integer and not a string
        // This means that the mapping lives inside this class :(

        let url
        if (categoryId) {
            // The mapping mentioned before
            // TODO: check if `categoryId` is good or not:
            // what happen if the user specify a `categoryId` equal to 10 ?
            const categoryName = categoriesById[categoryId]
            // https://fakestoreapi.com/products/category/jewelery
            url = `/products/category/${categoryName}`
        } else {
            // https://fakestoreapi.com/products
            url = '/products'
        }

        // Instrument `axios` the the response body is like `FakeProductListType`
        const productsLitResponse = await this.instance.get<FakeProductListType>(url)

        // Check if something went wrong
        if (productsLitResponse.status !== 200) {
            log.error('OUCH', { status: productsLitResponse.status })
            throw new Error('OUCH')
        }

        // The `this.instance.get<FakeProductListType>` is a merely instrumentation.
        // behind no check is made.
        // And we don't want to trust too much on external API. So we need to validate it!
        const productsLit = productsLitResponse.data
        if (!this.validate(productsLit)) {
            log.error('Validation failed', { errors: this.validate.errors })
            throw new Error('Qualcosa è cambiato')
        }

        // Because of the mapping, the DTO returned by FakeStoreAPI use a string as category and
        // we don't want propagate to our user this bad design, we need to map into ProductListType
        // changing just the category field. The others are the same
        return productsLit.map(p => {
            return { ...p, category: { name: p.category, id: categoryIdsByCategory[p.category] } }
        })
    }
}

export const ProductFilter = Type.Object({
    categoryId: Type.Optional(Type.Number()),
})
export type ProductFilterType = Static<typeof ProductFilter>;


const FakeProduct = Type.Object({
    id: Type.Number(),
    title: Type.String(),
    price: Type.Number(),
    description: Type.String(),
    category: Type.String(),
    image: Type.String(),
    rating: Type.Object({
        rate: Type.Number(),
        count: Type.Number(),
    })
})
const FakeProductList = Type.Array(FakeProduct)
type FakeProductListType = Static<typeof FakeProductList>;

export const Product = Type.Object({
    id: Type.Number(),
    title: Type.String(),
    price: Type.Number(),
    description: Type.String(),
    category: Type.Object({
        id: Type.Optional(Type.Number()),
        name: Type.String(),
    }),
    image: Type.String(),
    rating: Type.Object({
        rate: Type.Number(),
        count: Type.Number(),
    })
})
export type ProductType = Static<typeof Product>;

export const ProductList = Type.Array(Product)
export type ProductListType = Static<typeof ProductList>;
