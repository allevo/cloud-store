# CloudStore project

Use FakeStoreAPI for developing a Cart Service.

The project is based on [`fastify`](https://fastify.io/) and use [`axios`](https://www.npmjs.com/package/axios) for interacting with [`Fake Store API`](https://fakestoreapi.com/docs) and [`mongodb`](https://www.mongodb.com/) as database. Use [`JWT`](https://jwt.io/) though [`fastify-jwt`](https://www.npmjs.com/package/fastify-jwt) for Authorization. The credentials Database is hardcoded for simplicity.

## Docker

For running mongo locally, you can use [`docker`](https://docs.docker.com/) for running the proper image. Something like:
```
docker run --name mongo --rm -d -p 27017:27017 mongo:5.0.6
```

Other images can be found at [`Docker Hub`](https://hub.docker.com/)

## Available Scripts

The project is created using [Fastify-CLI](https://www.npmjs.com/package/fastify-cli).

In the project directory, you can run:

### `npm run dev`

To start the app in dev mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm start`

For production mode

### `npm run test`

Run the test cases.

## Learn More

To learn Fastify, check out the [Fastify documentation](https://www.fastify.io/docs/latest/).
