import { NextFunction, Request, Response } from "express";
import * as moment from "moment";
import { decodeToken, slugifyText, slugifyProduct, getRandomProductCode } from '../../helpers/helpers';
import Category from "../../models/category";
import FeaturedProduct from "../../models/featured_products";
import HotProduct from "../../models/hot_product";
import Product from "../../models/product";
import Role from "../../models/role";
import User from "../../models/user";
import AWS from '../../helpers/aws'
import * as fs from 'fs'
import * as sharp from 'sharp';
import * as xml from 'xml'
import * as builder from 'xmlbuilder';

class ProductsController {
  public async index(req: Request, res: Response, next: NextFunction) {
    const role = await Role.findOne({ name: "dealer" }).select("_id");
    const dealers = await User.find({
      "companyDetails.address.location": {
      $nearSphere: { $geometry: { type: "Point", coordinates: [req.query.long, req.query.lat] }, $maxDistance: 10 * 1000 } },
      role: role._id
    }).select("_id");
    const conditions: any = {};
    const inFilters = ["size", "grade", "categories", "subCategories", "type", "finish", "suitability"];
    if (Object.keys(req.query) instanceof Array) {
      Object.keys(req.query).forEach(item => {
        if (inFilters.indexOf(item) >= 0) {
          const payload = req.query[item].split(",");
          conditions[item] = { $in: payload };
        }
      });
    }

    const products = await Product.find({
      seller: { $in: dealers.map((item: any) => item._id) },
      // is_active: true,
      ...conditions
    })
      .populate((global as any).productsPopulate)
      .sort({ order: 1 })
      .skip(req.query.pageIndex * req.query.pageSize)
      .limit(Number(req.query.pageSize));

    const productsCount = await Product.countDocuments({
      seller: { $in: dealers.map((item: any) => item._id) }, ...conditions
    });
    return res.status(200).json({ success: true, data: products, counts: productsCount });
  }

  public async show(req: Request, res: Response) {
    try {
      const product = await Product.findOne({ slug: req.params.slug }).populate(
        (global as any).productsPopulate
      ).populate({ path: 'brochure' });
      const otherProducts = await Product.find({
        subCategories: { $in: product.subCategories }
      })
        .populate((global as any).productsPopulate)
        .sort({ order: 1 })
        .limit(6);

      const role = await Role.findOne({ name: "dealer" }).select("_id");
      const dealers = await User.find({ role: role._id }).select("_id");
      const hotProductsIds = await HotProduct.find({
        seller: { $in: dealers.map(item => item._id) },
        endDate: { $gte: moment().toISOString() }
      }).select("product");

      const hotProducts = await Product.find({
        _id: { $in: hotProductsIds.map(item => item.product) }
      })
        .populate((global as any).productsPopulate)
        .limit(2);

      return res.status(200).json({
        success: true,
        data: product,
        otherProducts,
        hotProductsIds: hotProductsIds.map(item => item.product),
        hotProducts
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  public async create(req: Request, res: Response) {
    try {
      const user = await User.findOne({ _id: req.user._id })
      const { name, description, type, size, finish, suitability, grade,
        thickness, brochure, pcsPerBox, variant, videoUrl } = req.body
      const categories = req.body.categories.split(",")
      const subCategories = req.body.subCategories.split(",")
      const features = (req.body.features.length) ? req.body.features.split(',') : []
      const productCode = getRandomProductCode();
      const slug = slugifyProduct(req.body, productCode, user)
      const product = new Product({
        name, categories, subCategories, description, type, size, finish, suitability,
        grade, thickness, pcsPerBox, variant, videoUrl, features, productCode,
        slug
      })
      if (req.body.brochure && req.body.brochure !== null && req.body.brochure !== "null") product.brochure = brochure
      const images = [];
      if (req.files.length) {
        for (let i = 0; i < req.files.length; i++) {
          const imgBuffer = await sharp(fs.readFileSync(req.files[i].path))
            .resize(1000)
            .toBuffer();
          const url = await AWS.uploadImage(req.files[i], req.user.username + '/products', imgBuffer)
          images.push({
            name: req.files[i].filename,
            path: url,
          })
          fs.unlinkSync(req.files[i].path)
        }
      }
      product.images = images
      product.seller = req.user._id
      await product.save()
      return res.status(200).json({ success: true, data: product });
    } catch (error) {
      return res.status(500).json({ error: true, message: error.message })
    }
  }

  public async getSellersProducts(req: Request, res: Response) {
    try {
      const user: any = decodeToken(req.headers.authorization);
      const data = await Product.find({ seller: user._id }).populate(
        (global as any).productsPopulate
      );
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  public async getManufacturerProducts(req: Request, res: Response) {
    try {
      const conditions: any = {};
      const inFilters = ["size", "grade", "categories", "subCategories", "type", "finish", "suitability"];
      if (Object.keys(req.query) instanceof Array) {
        Object.keys(req.query).forEach(item => {
          if (inFilters.indexOf(item) >= 0) {
            const payload = req.query[item].split(",");
            conditions[item] = { $in: payload };
          }
        });
      }
      const roles = await Role.find({ slug: { $in: ["manufacturer"] } }).select("_id");
      const users = await User.find({
        role: { $in: roles.map(item => item._id) }
      }).select("_id");
      const count = await Product.countDocuments({ seller: { $in: users.map(user => user._id) }, ...conditions })
      const products = await Product.find({ seller: { $in: users.map(user => user._id) }, ...conditions })
        .populate((global as any).productsPopulate)
        .sort({ order: 1 })
        .skip(req.query.pageIndex * req.query.pageSize)
        .limit(Number(req.query.pageSize));
      return res.status(200).json({ success: true, data: products, counts: count });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  public async getProductsByCompanySlug(req: Request, res: Response) {
    try {
      const seller = await User.findOne({
        "companyDetails.company_slug": req.params.company_slug
      }).select({ password: 0 });
      const products = await Product.find({ seller: seller._id }).populate(
        (global as any).productsPopulate
      );
      return res.status(200).json({ success: true, data: products, seller });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  public async getRecentProducts(req: Request, res: Response) {
    const products = await Product.find({})
      .sort({ order: 1 })
      .limit(8);
    return res.status(200).json({ success: true, data: products });
  }

  public async searchProducts(req: Request, res: Response) {
    const conditions: any = {
      $or: [{ name: { $regex: req.query.term, $options: "$i" } }]
    };
    const categories = await Category.find({
      name: { $regex: req.query.term, $options: "$i" }
    }).select({ _id: 1 });
    if (categories && categories instanceof Array) {
      conditions.$or.push({
        categories: { $in: categories.map(item => item._id) }
      });
    }
    const products = await Product.find(conditions)
      .select({ name: 1, slug: 1 })
      .limit(6);
    return res.status(200).json({ success: true, data: products });
  }

  public async getFeaturedProducts(req: Request, res: Response) {
    try {
      const role = await Role.findOne({ name: "dealer" }).select("_id");
      const dealers = await User.find({ role: role._id }).select("_id");
      const currentDate = moment();
      const endDate = currentDate.add(1, "month");
      const productIds = await FeaturedProduct.find({
        seller: { $in: dealers.map(item => item._id) },
        $or: [
          { startDate: { $gte: currentDate.toISOString() } },
          { startDate: { $lte: endDate.toISOString() } }
        ],
        endDate: { $lte: endDate.toISOString() }
      }).select("product");
      return res.status(200).json({ success: true, data: productIds });
    } catch (error) {
      return res.status(200).json({ error: error.message });
    }
  }

  public async getProductsByIds(req: Request, res: Response) {
    try {
      if (!req.query.productIds && req.query.productIds == null) {
        return res.status(200).json({ success: true, data: [] });
      }
      const products = await Product.find({
        _id: { $in: req.query.productIds.split(",") }
      }).populate((global as any).productsPopulate);
      return res.status(200).json({ success: true, data: products });
    } catch (error) {
      return res.status(500).json({ error: error.message, data: [] });
    }
  }

  public async getProductById(req: Request, res: Response) {
    try {
      const product = await Product.findById(req.params.id);
      return res.status(200).json({ success: true, data: product });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  public async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, type, size, finish, suitability, grade,
        thickness, pcsPerBox, variant, videoUrl } = req.body
      const categories = req.body.categories.split(",")
      const subCategories = req.body.subCategories.split(",")
      const features = (req.body.features.length) ? req.body.features.split(',') : []
      const data = {
        name, description, type, size, finish, suitability, grade,
        thickness, pcsPerBox, variant, videoUrl, categories,
        subCategories, features
      }
      if (req.body.brochure && req.body.brochure !== 'undefined') {
        Object.assign(data, { brochure: req.body.brochure })
      }
      const product = await Product.findByIdAndUpdate(req.params.id, {
        $set: data
      }, { upsert: true })
      return res.status(200).json({ success: true, product })
    } catch (error) {
      return res.status(500).json({ error: true, message: error.message })
    }
  }

  public async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await Product.findById(req.params.id)
      await product.remove()
      return res.status(200).json({ success: true })
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  public async generateXML(req: Request, res: Response, next: NextFunction) {
    const products = await Product.find({})
    var root = builder.create('urlset').attribute("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9");
    for (let index = 0; index < products.length; index++) {

      var item: any = root.ele('url')
      item.ele("loc", `https://tilescart.com/products/${products[index].slug}`)
      item.ele("lastmod", `${new Date().toISOString()}`)
      item.ele("changefreq", 'weekly')
      item.ele("priority", '0.8')
    }
    var xml = root.end({ pretty: true });
    res.set('Content-Type', 'text/xml')
    return res.status(200).send(xml)
  }
}

export default new ProductsController();
