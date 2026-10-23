const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Brand = require("../models/Brand");
const Category = require("../models/Category");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const validate = require("../middleware/validate");
const upload = require("../middleware/upload");
const { requireAdmin } = require("../middleware/auth");
const { uniqueSlug, escapeRegex } = require("../utils/text");
const { uploadImage, deleteImages } = require("../services/storage");

const router = express.Router();
const objectId = Joi.string().hex().length(24);

// En multipart, les tableaux arrivent en JSON ou en lignes séparées
const stringList = Joi.alternatives().try(
  Joi.array().items(Joi.string().trim().max(200)),
  Joi.string().custom((value, helpers) => {
    const v = value.trim();
    if (!v) return [];
    if (v.startsWith("[")) {
      try {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed)) return parsed.map(String).map((s) => s.trim()).filter(Boolean);
      } catch {
        return helpers.error("any.invalid");
      }
    }
    return v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  })
);

const listSchema = Joi.object({
  search: Joi.string().trim().max(100).allow(""),
  category: Joi.string().trim().max(80),
  brand: Joi.string().trim().max(200), // id, slug, ou plusieurs séparés par des virgules
  group: Joi.string().valid("gros-menagers", "petits-menagers"),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  inStock: Joi.boolean(),
  featured: Joi.boolean(),
  promo: Joi.boolean(),
  sort: Joi.string().valid("newest", "price-asc", "price-desc", "name").default("newest"),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(60).default(12),
  includeInactive: Joi.boolean().default(false),
});

const baseFields = {
  name: Joi.string().trim().min(2).max(140),
  description: Joi.string().trim().max(5000).allow(""),
  price: Joi.number().integer().min(0),
  oldPrice: Joi.alternatives().try(Joi.number().integer().min(0), Joi.valid(null, "")),
  stock: Joi.number().integer().min(0),
  characteristics: stringList,
  brand: objectId,
  category: objectId,
  featured: Joi.boolean(),
  isActive: Joi.boolean(),
};

const createSchema = Joi.object({
  ...baseFields,
  name: baseFields.name.required(),
  price: baseFields.price.required(),
  stock: baseFields.stock.required(),
  brand: baseFields.brand.required(),
  category: baseFields.category.required(),
});

const updateSchema = Joi.object({ ...baseFields, keepImages: stringList });

const SORTS = {
  newest: { createdAt: -1 },
  "price-asc": { price: 1, _id: 1 },
  "price-desc": { price: -1, _id: 1 },
  name: { name: 1 },
};

const resolveRefs = async (Model, key) => {
  const parts = String(key).split(",").map((s) => s.trim()).filter(Boolean);
  const ids = parts.filter((p) => mongoose.isValidObjectId(p));
  const slugs = parts.filter((p) => !mongoose.isValidObjectId(p)).map((s) => s.toLowerCase());
  const docs = await Model.find({ $or: [{ _id: { $in: ids } }, { slug: { $in: slugs } }] }).select("_id").lean();
  return docs.map((d) => d._id);
};

const cleanOldPrice = (body) => {
  if (body.oldPrice === "" || body.oldPrice === 0) body.oldPrice = null;
};

const checkRefs = async ({ brand, category }) => {
  const result = {};
  if (brand && !(await Brand.exists({ _id: brand }))) throw new AppError("Marque introuvable.", 400);
  if (category) {
    const cat = await Category.findById(category);
    if (!cat) throw new AppError("Catégorie introuvable.", 400);
    result.group = cat.group;
  }
  return result;
};

router.get(
  "/",
  validate(listSchema, "query"),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery;
    const filter = {};
    if (!(q.includeInactive && req.user?.role === "admin")) filter.isActive = true;
    if (q.search) {
      const rx = new RegExp(escapeRegex(q.search), "i");
      filter.$or = [{ name: rx }, { description: rx }];
    }
    if (q.group) filter.group = q.group;
    if (q.category) filter.category = { $in: await resolveRefs(Category, q.category) };
    if (q.brand) filter.brand = { $in: await resolveRefs(Brand, q.brand) };
    if (q.minPrice !== undefined || q.maxPrice !== undefined) {
      filter.price = {};
      if (q.minPrice !== undefined) filter.price.$gte = q.minPrice;
      if (q.maxPrice !== undefined) filter.price.$lte = q.maxPrice;
    }
    if (q.inStock) filter.stock = { $gt: 0 };
    if (q.featured) filter.featured = true;
    if (q.promo) filter.oldPrice = { $gt: 0 };

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort(SORTS[q.sort])
        .skip((q.page - 1) * q.limit)
        .limit(q.limit)
        .populate("brand", "name slug")
        .populate("category", "name slug group")
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({ items, total, page: q.page, pages: Math.max(1, Math.ceil(total / q.limit)), limit: q.limit });
  })
);

router.get(
  "/:key",
  asyncHandler(async (req, res) => {
    const { key } = req.params;
    const filter = mongoose.isValidObjectId(key) ? { _id: key } : { slug: key.toLowerCase() };
    if (req.user?.role !== "admin") filter.isActive = true;
    const product = await Product.findOne(filter).populate("brand", "name slug logo").populate("category", "name slug group");
    if (!product) throw new AppError("Produit introuvable.", 404);

    const related = await Product.find({
      _id: { $ne: product._id },
      category: product.category._id,
      isActive: true,
    })
      .limit(4)
      .populate("brand", "name slug")
      .lean();

    res.json({ product, related });
  })
);

router.post(
  "/",
  requireAdmin,
  upload.array("images", 6),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    cleanOldPrice(req.body);
    const { group } = await checkRefs(req.body);
    const images = await Promise.all((req.files || []).map((f) => uploadImage(f, "products")));
    try {
      const product = await Product.create({
        ...req.body,
        group,
        images,
        slug: await uniqueSlug(Product, req.body.name),
      });
      res.status(201).json(product);
    } catch (err) {
      await deleteImages(images);
      throw err;
    }
  })
);

router.patch(
  "/:id",
  requireAdmin,
  upload.array("images", 6),
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError("Produit introuvable.", 404);
    cleanOldPrice(req.body);
    const { keepImages, ...rest } = req.body;
    const { group } = await checkRefs(rest);
    if (group) rest.group = group;
    if (rest.name && rest.name !== product.name) rest.slug = await uniqueSlug(Product, rest.name, product._id);

    let removed = [];
    if (keepImages) {
      const keep = new Set(keepImages);
      removed = product.images.filter((img) => !keep.has(img.publicId) && !keep.has(img.url));
      product.images = product.images.filter((img) => keep.has(img.publicId) || keep.has(img.url));
    }
    const added = await Promise.all((req.files || []).map((f) => uploadImage(f, "products")));
    product.images.push(...added);
    if (product.images.length > 8) {
      await deleteImages(added);
      throw new AppError("8 images maximum par produit.", 400);
    }
    Object.assign(product, rest);
    await product.save();
    await deleteImages(removed);
    await product.populate("brand", "name slug");
    await product.populate("category", "name slug group");
    res.json(product);
  })
);

router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError("Produit introuvable.", 404);
    // Les commandes gardent une copie du nom/prix : la suppression ne les casse pas
    await product.deleteOne();
    await deleteImages(product.images);
    res.json({ message: "Produit supprimé." });
  })
);

module.exports = router;
