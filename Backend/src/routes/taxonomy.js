// Routes génériques pour les marques et les catégories (même structure)
const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const validate = require("../middleware/validate");
const upload = require("../middleware/upload");
const { requireAdmin } = require("../middleware/auth");
const { uniqueSlug } = require("../utils/text");
const { uploadImage, deleteImage } = require("../services/storage");

/**
 * @param {object} opts
 * @param {mongoose.Model} opts.Model
 * @param {string} opts.field     champ du produit qui référence ce modèle ("brand" | "category")
 * @param {string} opts.imageKey  nom du champ image ("logo" | "image")
 * @param {object} opts.extra     champs Joi supplémentaires
 * @param {string} opts.label     libellé pour les messages
 */
module.exports = ({ Model, field, imageKey, extra = {}, label, folder }) => {
  const router = express.Router();

  const createSchema = Joi.object({ name: Joi.string().trim().min(2).max(60).required(), ...extra });
  const updateSchema = Joi.object({
    name: Joi.string().trim().min(2).max(60),
    removeImage: Joi.boolean(),
    ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, v.optional()])),
  });

  const findByIdOrSlug = (key) =>
    mongoose.isValidObjectId(key) ? Model.findById(key) : Model.findOne({ slug: String(key).toLowerCase() });

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const filter = {};
      if (req.query.group && Model.GROUPS?.includes(req.query.group)) filter.group = req.query.group;
      const [items, counts] = await Promise.all([
        Model.find(filter).sort({ name: 1 }).lean(),
        Product.aggregate([{ $match: { isActive: true } }, { $group: { _id: `$${field}`, count: { $sum: 1 } } }]),
      ]);
      const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
      res.json(items.map((i) => ({ ...i, productCount: countMap.get(String(i._id)) || 0 })));
    })
  );

  router.get(
    "/:key",
    asyncHandler(async (req, res) => {
      const item = await findByIdOrSlug(req.params.key);
      if (!item) throw new AppError(`${label} introuvable.`, 404);
      res.json(item);
    })
  );

  router.post(
    "/",
    requireAdmin,
    upload.single("image"),
    validate(createSchema),
    asyncHandler(async (req, res) => {
      const data = { ...req.body, slug: await uniqueSlug(Model, req.body.name) };
      if (req.file) data[imageKey] = await uploadImage(req.file, folder);
      try {
        const item = await Model.create(data);
        res.status(201).json(item);
      } catch (err) {
        if (data[imageKey]) await deleteImage(data[imageKey]);
        throw err;
      }
    })
  );

  router.patch(
    "/:id",
    requireAdmin,
    upload.single("image"),
    validate(updateSchema),
    asyncHandler(async (req, res) => {
      const item = await Model.findById(req.params.id);
      if (!item) throw new AppError(`${label} introuvable.`, 404);
      const { removeImage, ...rest } = req.body;
      if (rest.name && rest.name !== item.name) item.slug = await uniqueSlug(Model, rest.name, item._id);
      Object.assign(item, rest);
      const oldImage = item[imageKey];
      if (req.file) {
        item[imageKey] = await uploadImage(req.file, folder);
      } else if (removeImage) {
        item[imageKey] = null;
      }
      await item.save();
      if ((req.file || removeImage) && oldImage) await deleteImage(oldImage);
      if (field === "category" && rest.group) {
        await Product.updateMany({ category: item._id }, { $set: { group: item.group } });
      }
      res.json(item);
    })
  );

  router.delete(
    "/:id",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const item = await Model.findById(req.params.id);
      if (!item) throw new AppError(`${label} introuvable.`, 404);
      const used = await Product.countDocuments({ [field]: item._id });
      if (used > 0) {
        throw new AppError(`Impossible de supprimer : ${used} produit(s) utilisent encore cette ${label.toLowerCase()}.`, 409);
      }
      await item.deleteOne();
      await deleteImage(item[imageKey]);
      res.json({ message: `${label} supprimée.` });
    })
  );

  return router;
};
