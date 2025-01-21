import { Router } from 'express'
// import exampleRouter from './routes/example/example.route'
// import authRouter from './routes/auth/auth.route'
import catalogRouter from './routes/catalog/catalog.route.js'
import { getImageGifts } from './routes/catalog/catalog.controller.js';
// import authorize from './middleware/authorize.middleware'
const mainRouter = Router()

// mainRouter.use('/example', authorize, exampleRouter)
// mainRouter.use('/auth', authRouter)
mainRouter.use('/catalog', catalogRouter);
mainRouter.use('/imagegifts',getImageGifts);

export default mainRouter
