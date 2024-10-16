import { useState } from "react";

const Accueil = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 986);
  const handelIsMobile = () => {
    setIsMobile(window.innerWidth < 968);
  };
  return (
    <div>
      <h1>nadjib__atamnia</h1>
    </div>
  );
};

export default Accueil;
