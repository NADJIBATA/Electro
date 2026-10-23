const slugify = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Rend un slug unique pour un modèle donné (ajoute -2, -3…)
const uniqueSlug = async (Model, base, excludeId) => {
  const root = slugify(base);
  let slug = root;
  let i = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    slug = `${root}-${i++}`;
  }
  return slug;
};

module.exports = { slugify, escapeRegex, uniqueSlug };
