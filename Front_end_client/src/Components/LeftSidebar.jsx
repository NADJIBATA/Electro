import React from "react";
import WebStarLogo from "../assets/WebStarLogo.png";

import { BiLogoFacebookSquare } from "react-icons/bi";
import { FaInstagram, FaFlag, FaProductHunt } from "react-icons/fa6";
import { FaArrowRight } from "react-icons/fa";
import { AiFillTikTok } from "react-icons/ai";
import { IoMdClose } from "react-icons/io";
import { IoHome } from "react-icons/io5";
import { Link } from "react-router-dom";
const LeftSidebar = () => {
  const Pages = [
    {
      name: "Acceuil WebStar",
      path: "/Acceuil",
      icon: <IoHome />,
    },
    {
      name: "MARQUES",
      path: "/brands",
      icon: <FaFlag />,
    },
    {
      name: "GROS MÉNAGERS",
      path: "/grosMenagers",
      icon: <FaArrowRight />,
    },
    {
      name: "PETITS MÉNAGERS",
      path: "/petitsMenagers",
      icon: <FaArrowRight />,
    },
    {
      name: "PRODUITS",
      path: "/products",
      icon: <FaProductHunt />,
    },
  ];
  return (
    <div className="flex flex-col items-center fixed top-0 left-0 h-full w-1/4 min-w-[350px] bg-custom-dark sidebar pt-8 z-50">
      <img src={WebStarLogo} className="relative w-64 mb-8 " />

      <ul className="flex flex-col justify-start items-center relative h-fit w-full divide-y divide-black   ">
        <div className="relative w-full h-8 flex justify-end pr-4 hover:bg-stone-800 transition delay-200 duration-300 md:ease-in flex items-center cursor-pointer ">
          {" "}
          <IoMdClose className="text-end text-red-500 h-6 w-6 relative" />
        </div>
        {Pages.map((page, index) => (
          <li
            key={index}
            className=" relative h-10 w-full flex items-center font-poppins text-xs font-[500] text-white pl-4 hover:bg-stone-800 transition delay-200 duration-300 md:ease-in"
          >
            <Link
              to={page.path}
              className=" relative w-full h-full flex items-center   "
            >
              {page.icon}
              <span className="ml-2">{page.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex justify-center items-center relative w-full h-8 mt-12">
        <div className="flex justify-center  items-center relative w-1/3 animate-bounce">
          <BiLogoFacebookSquare className="facebook-background text-white rounded w-6 h-6 mr-2 " />
          <Link
            to="https://web.facebook.com/nadjib.ath.28"
            className="font-poppins text-sm font-medium  text-white"
          >
            Facebook
          </Link>
        </div>
        <div className="flex justify-center  items-center relative w-1/3 animate-bounce">
          <FaInstagram className="text-white rounded w-6 h-6 mr-2 instagram-background " />
          <Link
            to="https://www.instagram.com/nadjib__atamnia/"
            className="font-poppins text-sm font-medium text-white"
          >
            Instgram
          </Link>
        </div>
        <div className="flex justify-center  items-center relative w-1/3 animate-bounce">
          <AiFillTikTok className="tiktok-background text-white rounded w-6 h-6 mr-2 " />
          <Link
            to="https://web.facebook.com/nadjib.ath.28"
            className="font-poppins text-sm font-medium text-white"
          >
            TikTok
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;
