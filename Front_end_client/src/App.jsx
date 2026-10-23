import { Route, Routes } from "react-router-dom";
import Layout, { RequireAuth, ScrollToTop } from "./components/Layout";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Product from "./pages/Product";
import Brands from "./pages/Brands";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Order from "./pages/Order";
import Track from "./pages/Track";
import { Login, Register } from "./pages/Auth";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/Dashboard";
import { OrderDetail, OrdersList } from "./admin/Orders";
import { ProductForm, ProductsList } from "./admin/Products";
import Taxonomy from "./admin/Taxonomy";
import Users from "./admin/Users";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="produits" element={<Catalog key="all" />} />
          <Route path="gros-menagers" element={<Catalog key="gros" group="gros-menagers" />} />
          <Route path="petits-menagers" element={<Catalog key="petits" group="petits-menagers" />} />
          <Route path="promotions" element={<Catalog key="promo" promo />} />
          <Route path="categorie/:slug" element={<Catalog key="cat" />} />
          <Route path="marque/:slug" element={<Catalog key="brand" />} />
          <Route path="marques" element={<Brands />} />
          <Route path="produit/:slug" element={<Product />} />
          <Route path="panier" element={<Cart />} />
          <Route path="commande" element={<Checkout />} />
          <Route path="commande/:id" element={<Order />} />
          <Route path="suivi" element={<Track />} />
          <Route path="connexion" element={<Login />} />
          <Route path="inscription" element={<Register />} />
          <Route path="compte" element={<RequireAuth><Account /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="admin" element={<RequireAuth admin><AdminLayout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="commandes" element={<OrdersList />} />
          <Route path="commandes/:id" element={<OrderDetail />} />
          <Route path="produits" element={<ProductsList />} />
          <Route path="produits/nouveau" element={<ProductForm key="new" />} />
          <Route path="produits/:id" element={<ProductForm />} />
          <Route path="categories" element={<Taxonomy key="categories" kind="categories" />} />
          <Route path="marques" element={<Taxonomy key="brands" kind="brands" />} />
          <Route path="clients" element={<Users />} />
        </Route>
      </Routes>
    </>
  );
}
