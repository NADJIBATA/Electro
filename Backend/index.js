if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const mongoose = require("mongoose");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const methodOverride = require("method-override");

const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flashConnect = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const AdminRoutes = require("./routes/Admin");
const ProductRoutes = require("./routes/Product");
const BrandRoutes = require("./routes/Brand");
const CategorieRoutes = require("./routes/Categorie");
const CommandRoutes = require("./routes/Command");
const Admin = require("./models/Admin");

mongoose.connect("mongodb://localhost:27017/Electro", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error :"));
db.once("open", () => {
  console.log("Data Base connected");
});

app.use(cookieParser("this is my secret cookie"));
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flashConnect());
app.use(passport.initialize());
app.use(passport.session());
passport.use(
  new LocalStrategy({ usernameField: "email" }, Admin.authenticate())
);
passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());
app.use("/Admin", AdminRoutes);
app.use("/Products", ProductRoutes);
app.use("/Brands", BrandRoutes);
app.use("/Categories", CategorieRoutes);
app.use("/Commands", CommandRoutes);

app.listen(PORT, () => {
  console.log(`Serving on port ${PORT}`);
});
