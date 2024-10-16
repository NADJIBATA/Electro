import React, { useState } from "react";

const Produits = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 986);
  const handelIsMobile = () => {
    setIsMobile(window.innerWidth < 968);
  };
  window.addEventListener("resize", handelIsMobile);
  return (
    <div>
      <h1>nadjib__atamnia</h1>
    </div>
  );
};

export default Produits;
