import { Router } from "express";
import { authUser, createUser } from "../middlewares/user-middleware.js";
import path from "node:path";
import multer from "multer";
import { connection } from "../server.js";

const storage = multer.diskStorage({
  destination: "photos/",
  filename: (req, file, cb) => {
    cb(null, req.body.login + path.extname(file.originalname));
  },
});
const configMulter = multer({ storage: storage });

const userRoutes = Router();

userRoutes
  .route("/signup")
  .get((req, res) => res.render("form_register"))
  .post(configMulter.single("file"), createUser, (req, res) => {
    req.session.user = {
      login: req.body.login,
      email: req.body.email,
      image: req.file.filename,
    };
    res.redirect("/");
  });

userRoutes
  .route("/signin")
  .get((req, res) => res.render("form_auth"))
  .post(authUser, (req, res) => {
    req.session.user = {
      login: req.body.login,
      email: req.body.email,
      image: req.body.image,
    };
    res.redirect("/");
  });

userRoutes
  .route("/admin")
  .get( async (req,res)=>{
    const users = (await connection.promise().query("SELECT id, login, email, image FROM users"))[0];
    res.render("users_crud",{users:users})
  })

userRoutes.get("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy(); //знищення сессії
  }
  res.redirect("/");
});

userRoutes.get("/list", async (req, res) => {
  const users = (await connection.promise().query("SELECT id, login, email, image FROM users"))[0];
  res.render("user_list", { users });
});

export default userRoutes;
