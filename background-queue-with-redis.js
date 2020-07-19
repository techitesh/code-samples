import { ProductUploadQueue, SMSQueue, EnquiryQueue, UsersQueue } from './queue';
import Product from '../models/product'
import Category from "../models/category";
import Finish from "../models/finish";
import Grade from "../models/grade";
import Size from "../models/size";
import SubCategory from "../models/subCategory";
import Suitability from "../models/suitability";
import Type from "../models/type";
import User from "../models/user";
import SMS from '../helpers/sms';
import { getRandomProductCode, slugifyProduct } from '../helpers/helpers';
import { ObjectID } from 'bson';

SMSQueue.process(async (job, done) => {
    try {
        const { phone, message } = job.data;
        const sms = new SMS(phone, message);
        const response = await sms.send();
        job.progress(100)
        return Promise.resolve("Hello world")
    } catch (error) {
        throw new Error(error.message)
    }
});

EnquiryQueue.process(async (job, done) => {
    try {
        const { phone, message } = job.data;
        const sms = new SMS(phone, message);
        await sms.send();
        job.progress(100)
        return done(null, true)
    } catch (error) {
        done(error.message, false)
    }
})

ProductUploadQueue.process(async (job, done) => {
    try {
        const obj = job.data.obj
        const seller = job.data.seller
        const categories = await Category.find({ slug: { $in: obj.categories.split(",") } });
        if (!categories) return done(new Error(`Category ${obj.categories.split(",")} does not Exists`), false)
        const categoriesId = [];
        categories.forEach(item => {
            if (categories && categories instanceof Object) { categoriesId.push(item._id); }
        });

        const subCategories = await SubCategory.find({ slug: { $in: obj.subCategories.split(",") } });
        if (!subCategories) { done(new Error(`Category ${obj.subCategories.split(",")} does not Exists`), false) }
        const subCategoriesId = [];

        subCategories.forEach((item: any) => {
            if (item && item instanceof Object) { subCategoriesId.push(item._id); }
        });

        const type = await Type.findOne({ $or: [{ slug: obj.type }, { name: obj.type }] });
        console.log(type);
        if (!type) { return done(new Error(`Type ${obj.type} does not exists`), false); }

        const size = await Size.findOne({ $or: [{ name: obj.size }, { slug: obj.size }] });
        if (!size) { return done(new Error(`Size ${obj.size} does not exists`), false); }

        const grade = await Grade.findOne({ $or: [{ slug: obj.grade }, { name: obj.grade }] });
        if (!grade) { return done(new Error(`grade ${obj.grade} does not exists`), false); }

        const suitability = await Suitability.findOne({ $or: [{ slug: obj.suitability }, { name: obj.suitability }] });
        if (!suitability) { return done(new Error(`suitability ${obj.suitability} does not exists`), false); }

        const finish = await Finish.findOne({ $or: [{ slug: obj.finish }, { name: obj.finish }] });
        if (!finish) { return done(new Error(`finish ${obj.finish} does not exists`), false); }

        const imagesKey = ["image_1", "image_2", "image_3", "image_4"];
        const images = [];
        imagesKey.forEach(item => {
            if (obj.hasOwnProperty(item)) {
                images.push({ name: obj[item], path: `https://tilescart.nyc3.digitaloceanspaces.com/${seller.username}/products/${obj[item]}` });
            }
        });
        const thickness = (obj.thickness) ? `${obj.thickness} MM` : ''
        const variant = (obj.variant) ? `± ${obj.variant} mm` : ''
        const features = (obj.features.split(',').length) ? obj.features.split(',') : []
        const productCode = getRandomProductCode();
        const slug = slugifyProduct(obj, productCode, seller);
        await Product.findOneAndUpdate(
            { $and: [{ name: obj.name }, { seller: seller._id }, { productCode: productCode }] },
            {
                name: obj.name, size: size._id, grade: grade._id, suitability: suitability._id,
                finish: finish._id, seller: seller._id, categories: categoriesId,
                pcsPerBox: obj.pcs_per_box, pricePerSqFt: obj.price_per_sq_ft,
                totalAvailableBox: obj.total_available_box,
                images, subCategories: subCategoriesId, slug, productCode, type,
                thickness, variant, features, is_active: true,
                order: Math.floor(100000000 + Math.random() * 900000000),
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
            },
            { new: true, upsert: true }
        );
        job.progress(100)
        return done(null, true)
    } catch (error) {
        return done(error, null)
    }
})

UsersQueue.process(async (job, done) => {
    try {
        const data = job.data
    const user = new User({
            email: data.email,
            password: "$2b$10$H7iNDlyd06gROI/b1PLDZuhUFkd8j0TE4DPELesnXpfSY4O7c2ime",
            mobile: data.mobile,
            username: data.username,
            role: new ObjectID("5d18fcdaac26970c4bd756d5"),
            companyDetails: {
                name: data.company_name,
                address: {
                    address_line_1: data.address,
                    country: data.country,
                    state: data.state,
                }
            },
            is_approved: true,
            is_mobile_verified: true,
            is_email_verified: true
        })
        await user.save()
        return done(null, job.data._id)
    } catch (error) {
        return done(new Error(error.message), false)
    }
})