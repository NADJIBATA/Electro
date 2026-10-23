import { useState } from "react";
import { MdKitchen, MdLocalLaundryService, MdMicrowave, MdAcUnit, MdTv, MdCoffeeMaker, MdIron, MdBlender } from "react-icons/md";
import { GiVacuumCleaner, GiCookingPot } from "react-icons/gi";
import { MdOutlineElectricalServices } from "react-icons/md";
import { imageUrl } from "../lib/api";

// Pictogramme selon la catégorie quand un produit n'a pas encore de photo
const ICONS = [
  [/refrig|frigo|congel/, MdKitchen],
  [/laver|linge|lave|seche/, MdLocalLaundryService],
  [/micro/, MdMicrowave],
  [/clim|ventil|chauff/, MdAcUnit],
  [/tele|tv|ecran/, MdTv],
  [/cafe|expresso/, MdCoffeeMaker],
  [/fer|repass|vapeur/, MdIron],
  [/robot|blender|mixeur|cuisine/, MdBlender],
  [/cuisin|four|plaque|hotte/, GiCookingPot],
  [/aspir/, GiVacuumCleaner],
];

export const iconFor = (hint = "") => {
  const h = hint.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return ICONS.find(([rx]) => rx.test(h))?.[1] || MdOutlineElectricalServices;
};

export default function ProductImage({ src, alt, hint, className = "", iconClass = "h-1/3 w-1/3" }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={imageUrl(src)}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`h-full w-full object-contain ${className}`}
      />
    );
  }
  const Icon = iconFor(hint || alt);
  return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-b from-white to-steel/60 ${className}`} role="img" aria-label={alt}>
      <Icon className={`${iconClass} text-steel-dark`} aria-hidden />
    </div>
  );
}
