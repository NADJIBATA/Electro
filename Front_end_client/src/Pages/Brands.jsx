import React, { useState } from "react";

const Brands = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 986);
  const handelIsMobile = () => {
    setIsMobile(window.innerWidth < 968);
  };
  window.addEventListener("resize", handelIsMobile);
  return (
    <div className="relative z-40 h-fit min-h-full w-7/12 bg-white ">
      
    </div>
  );
};

export default Brands;
