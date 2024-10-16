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
      className={`relative w-full h-fit min-h-full flex flex-col items-center bg-custom-white z-30 `}
    >
      <Header />
      <div
        className={`relative  h-full   overflow-y-scroll mb-2 z-30 w-7/12 bg-white ${
          isMobile ? "mt-16" : "mt-28"
        } `}
      >
        <Outlet className="bg-blue-500" />
      </div>
    </div>
  );
};

export default Home;
