// Stockage des images : Cloudinary si configuré, sinon disque local (dev uniquement)
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const env = require("../config/env");

const LOCAL_DIR = path.join(__dirname, "../../uploads");

let cloudinary = null;
if (env.cloudinaryEnabled) {
  cloudinary = require("cloudinary").v2;
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

const uploadImage = async (file, subfolder = "misc") => {
  if (cloudinary) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `${env.CLOUDINARY_FOLDER}/${subfolder}`,
          resource_type: "image",
          transformation: [{ width: 1600, height: 1600, crop: "limit", quality: "auto", fetch_format: "auto" }],
        },
        (err, res) => (err ? reject(err) : resolve(res))
      );
      stream.end(file.buffer);
    });
    return { url: result.secure_url, publicId: result.public_id };
  }

  if (env.isProd) {
    throw new Error("Cloudinary n'est pas configuré : impossible d'enregistrer des images en production.");
  }
  await fs.mkdir(path.join(LOCAL_DIR, subfolder), { recursive: true });
  const name = `${crypto.randomUUID()}.${EXT[file.mimetype] || "bin"}`;
  await fs.writeFile(path.join(LOCAL_DIR, subfolder, name), file.buffer);
  const base = env.API_PUBLIC_URL || "";
  return { url: `${base}/uploads/${subfolder}/${name}`, publicId: `local:${subfolder}/${name}` };
};

const deleteImage = async (image) => {
  if (!image?.publicId) return;
  try {
    if (image.publicId.startsWith("local:")) {
      const rel = image.publicId.slice(6);
      if (rel.includes("..")) return;
      await fs.unlink(path.join(LOCAL_DIR, rel));
    } else if (cloudinary) {
      await cloudinary.uploader.destroy(image.publicId);
    }
  } catch (err) {
    if (!env.isTest) console.warn("Suppression d'image impossible :", err.message);
  }
};

const deleteImages = (images = []) => Promise.all(images.map(deleteImage));

module.exports = { uploadImage, deleteImage, deleteImages, LOCAL_DIR };
