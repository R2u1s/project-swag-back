import { Router } from 'express'
import {
  countCategory,
  filterProduct,
  findMany,
  findOne,
  findProductToCategoy,
  findProductOtherColor,
  gelAllBrand,
  getAllCountProducts,
  getCartProduct,
  searchProduct,
  searchProductCount,
  findSimilarProducts,
  findFiles,
  getCategoryProducts,
  getCategoryProductsCount,
  anotherColorProduct,
  cartProducts,
  getGroupProducts,
  getAllCategories,
  getImageGifts,
  getCategoryInfo,
  findPrintOptions
} from './catalog.controller.js'


const router = Router()

router.route('/').get(findMany).post(getCartProduct)
router.route('/product/:id').get(findOne)
router.route('/product').get(anotherColorProduct)
router.route('/cart').post(cartProducts)
router.route('/group').post(getGroupProducts)
router.route('/count').get(getAllCountProducts)
router.route('/categories').get(getAllCategories)
router.route('/category').post(getCategoryProducts)
router.route('/category?:id').get(getCategoryInfo)
router.route('/category/count').post(getCategoryProductsCount)
router.route('/search').post(searchProduct)
router.route('/search/count').post(searchProductCount)
router.route('/brand').get(gelAllBrand)
router.route('/price').post(filterProduct)
router.route('/findpic').post(findProductOtherColor)
router.route('/findsimilarproducts/:id').get(findSimilarProducts)
router.route('/files/:id').get(findFiles)
router.route('/print_options/:id').get(findPrintOptions)


export default router
