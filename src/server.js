import express from "express";
import exphbs from "express-handlebars";
import cookieParser from "cookie-parser";
import session from "express-session";
import "dotenv/config";
import path from "node:path";
import siteRoutes from "./routes/site-routes.js";
import userRoutes from "./routes/user-routes.js";
import { checkUser } from "./middlewares/user-middleware.js";
import { createRequire } from 'module';
import mysql from "mysql2"
import adminRoutes from "./routes/admin-routes.js"

const require = createRequire(import.meta.url);
const MySQLStore = require('express-mysql-session')(session);


const options = {
	host: 'localhost',
	port: 3306,
	user: 'root',
	password: 'rootroot',
	database: 'knp211'
};

export const connection = mysql.createConnection(options)

await connection.connect((err)=>{
  if(err){
    console.log(err);
  }
  else{
      const sessionStore = new MySQLStore({}, connection);

      const PORT = process.env.PORT || 3000;
      //#region options for hbs
      const hbs = exphbs.create({
        defaultLayout: "main",
        extname: "hbs",
      });
      //#endregion

      const app = express();
      app.use(express.static("photos"));
      app.use(cookieParser());
      app.use(
        session({
          secret: process.env.SESSION_KEY,
          resave: false,
          store: sessionStore,
          saveUninitialized: false, //створення сессії без даних
          cookie: { maxAge: 1000 * 60 * 60 },
        })
      );
      app.use(checkUser);
      //#region handlebars
      app.use(express.static("public"));
      app.engine("hbs", hbs.engine);
      app.set("view engine", "hbs");
      app.set("views", path.join("src", "views"));
      //#endregion
      app.use(express.urlencoded({ extended: true }));
      app.use(siteRoutes);
      app.use("/user", userRoutes);
      app.use("/admin", adminRoutes);

      app.listen(PORT, () =>
        console.log(`Server is running http://localhost:${PORT}`)
      );
    }
})

