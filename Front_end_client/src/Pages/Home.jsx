import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../Components/Header";

const Home = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 986);
  const handelIsMobile = () => {
    setIsMobile(window.innerWidth < 968);
  };
  window.addEventListener("resize", handelIsMobile);
  return (
    <div
      className={`relative w-full h-full flex flex-col items-center  z-20 `}
    >
      <Header />
      <div
        className={`relative h-full overflow-y-scroll z-30 w-full flex justify-center items-center  bg-custom-white  ${
          isMobile ? "mt-12" : "mt-24"
        } `}
      >
        <Outlet  />
      </div>
    </div>
  );
};

export default Home;
