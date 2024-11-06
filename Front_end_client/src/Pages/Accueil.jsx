import { useState } from "react";

const Accueil = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 986);
  const handelIsMobile = () => {
    setIsMobile(window.innerWidth < 968);
  };
  return (
    <div className="relative  z-40 h-fit min-h-full  w-7/12 bg-white ">
    
   


    </div>
  );
};

export default Accueil;
