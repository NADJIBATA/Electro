import React, { useState } from "react";

const PetitsMenagers = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 986);
  const handelIsMobile = () => {
    setIsMobile(window.innerWidth < 968);
  };
  window.addEventListener("resize", handelIsMobile);
  return (
    <div className="bg-red-500 w-full h-full">
      <h1>nadjib__atamnia</h1>
    </div>
  );
};

export default PetitsMenagers;
