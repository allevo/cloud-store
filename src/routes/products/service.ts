import { Static, Type } from "@sinclair/typebox";
import axios, { AxiosInstance } from 'axios'
import Ajv, { ValidateFunction } from 'ajv'
import { FastifyLoggerInstance } from "fastify";

interface Category {
    [key: number]: string;
}

const categoriesById: Category = {
    1: 'electronics',
    2: 'jewelery',
    3: 'men\'s clothing',
    4: 'women\'s clothing',
}

export default class ProductService {
    instance: AxiosInstance;
    validate: ValidateFunction;

    constructor() {
        this.instance = axios.create({
            baseURL: 'https://fakestoreapi.com/',
            timeout: 30000,
        });

        const ajv = new Ajv().addKeyword('kind').addKeyword('modifier')
        this.validate = ajv.compile(FakeProductList)
    }

    async getProducts(log: FastifyLoggerInstance, { categoryId }: ProductFilterType): Promise<ProductListType> {
        let url
        if (categoryId) {
            // https://fakestoreapi.com/products/category/jewelery
            const categoryName = categoriesById[categoryId]
            url = `/products/category/${categoryName}`
        } else {
            // https://fakestoreapi.com/products
            url = '/products'
        }

        const productsLitResponse = await this.instance.get<FakeProductListType>(url)

        if (productsLitResponse.status !== 200) {
            log.error('OUCH', { status: productsLitResponse.status })
            throw new Error('OUCH')
        }

        const productsLit = productsLitResponse.data
        if (!this.validate(productsLit)) {
            log.error('Validation failed', { errors: this.validate.errors })
            throw new Error('Qualcosa è cambiato')
        }

        return productsLit.map(p => {
            return { ...p, category: { name: p.category, id: 2 } }
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
