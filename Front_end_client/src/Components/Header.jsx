import React, { useState } from "react";
import WebStarLogo from "../assets/WebStarLogo.png";
import { IoMenu } from "react-icons/io5";
import { Link, NavLink } from "react-router-dom";
import LeftSidebar from "./LeftSidebar";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 986);

  const Pages = [
    {
      name: "Acceuil",
      path: "/Acceuil",
    },
    {
      name: "GROS MÉNAGERS",
      path: "/grosMenagers",
    },
    {
      name: "PETITS MÉNAGERS",
      path: "/petitsMenagers",
    },
    {
      name: "MARQUES",
      path: "/brands",
    },
    {
      name: "PRODUITS",
      path: "/products",
    },
  ];

  const openSidebar = () => {
    setIsOpen(!isOpen);
    console.log(isOpen);
  };
  const handelIsMobile = () => {
    setIsMobile(window.innerWidth < 968);
  };
  window.addEventListener("resize", handelIsMobile);
  return (
    <div
      className=" relative  w-full flex "
      onClick={() => {
        isOpen && setIsOpen(false);
      }}
    >
      {isOpen && <LeftSidebar />}
      <div className="flex flex-col justify-start items-center fixed top-0 w-full h-fit bg-custom-green background overflow-x-hidden z-40 ">
        <div
          className={
            isMobile
              ? "flex justify-between items-center relative h-12 w-full z-50 bg-custom-green px-4"
              : "flex justify-between items-center relative h-12 w-7/12 w-min-[500px]  z-50 bg-custom-green px-2 "
          }
        >
          <div className="relative w-5/12 h-8  flex justify-start items-center">
            <img src={WebStarLogo} className="relative w-64" />
          </div>
          <div className="relative w-5/12 h-8  flex justify-end items-center">
            <IoMenu
              className="w-12 h-8 text-end font-poppins text-white text-xl  cursor-pointer"
              onClick={openSidebar}
            />
          </div>
        </div>
        {!isMobile && (
          <ul className="flex justify-around  items-center relative h-12 w-7/12 bg-custom-green1  ">
            {Pages.map((page, index) => (
              <li
                key={index}
                className="font-poppins text-[15px] font-[500] text-white relative w-fit h-full"
              >
                <NavLink
                  to={page.path}
                  className={(isActive) =>
                    isActive.isActive
                      ? "nav-link relative w-full h-full hover:text-white text-[1em] font-poppins flex items-center justify-center px-4 "
                      : "nav-linkhover relative w-full h-full hover:text-white text-[1em] font-poppins flex items-center justify-center px-4"
                  }
                >
                  {page.name}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Header;
