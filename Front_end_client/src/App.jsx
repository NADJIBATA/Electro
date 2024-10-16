import {
  BrowserRouter as Router,
  Routes,
  Route,
  BrowserRouter,
} from "react-router-dom";
import { NavLink } from "react-router-dom";
import Home from "./Pages/Home";
import Accueil from "./Pages/Accueil";
import "./App.css";
import Header from "./Components/Header";
import Produits from "./Pages/Produits";
import Brands from "./Pages/Brands";
import GrosMengers from "./Pages/GrosMengers";
import PetitsMenagers from "./Pages/PetitsMenagers";
function App() {
  return (
    <div className="relative h-full w-full m-0 p-0">
      <Routes>
        <Route element={<Home />}>
          <Route element={<Accueil />} path="/Acceuil" />
          <Route element={<Produits />} path="/products" />
          <Route element={<Brands />} path="/brands" />
          <Route element={<GrosMengers />} path="/grosMenagers" />
          <Route element={<PetitsMenagers />} path="/petitsMenagers" />
          <Route element={<Accueil />} path="*" />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
