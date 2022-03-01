import { test } from 'tap'
import { ResponseType } from '../../src/routes/auth'
import { ProductListType } from '../../src/routes/products/service'
import { CartDTOType } from '../../src/routes/users/service'
import { build } from '../helper'

test('test flow', async (t) => {
  const app = await build(t)

  const loginResponse = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { username: 'allevo', password: 'pwd' }
  })
  t.equal(loginResponse.statusCode, 200)

  const loginPayload = JSON.parse(loginResponse.payload) as ResponseType
  const token = loginPayload.token

  const productsResponse = await app.inject({
    method: 'GET',
    url: '/products',
  })
  t.equal(productsResponse.statusCode, 200)

  const productsPayload = JSON.parse(productsResponse.payload) as ProductListType
  const product = productsPayload[0]

  const addProductToCartResponse = await app.inject({
    method: 'PUT',
    url: '/users/allevo/cart/products',
    payload: product,
    headers: {
      authorization: 'Bearer ' + token,
    }
  })
  t.equal(addProductToCartResponse.statusCode, 200, 'Invalid status code', { payload: addProductToCartResponse.payload, product })

  const addProductToCartPayload = JSON.parse(addProductToCartResponse.payload) as CartDTOType
  console.log(addProductToCartPayload)
})
