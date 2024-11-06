import { users } from "../data/users.js";
import bcrypt from "bcrypt";
import path from "node:path";
import { connection } from "../server.js";
import {randomBytes} from 'crypto';

export const checkUser = (req, res, next)=> {
  if(req.session && req.session.user){
      res.locals.user = {login: req.session.user.login, image:req.session.user.image};
  }
  next ();
}

export const createUser = async (req, res, next) => {
  if (
    req.body &&
    req.body.answer &&
    req.body.login &&
    req.body.email &&
    req.body.password &&
    req.body.confirm_password &&
    req.body.password === req.body.confirm_password
  ) {
    const { login, email, password } = req.body;
    const user = ( await connection.promise().query(`SELECT login FROM users WHERE login='${login}'`))[0][0];
    console.log(user);
    if (!user || user.length === 0) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);
      await connection.promise().query(
        `INSERT INTO users (id, login, email, password, image) VALUES (?, ?, ?, ?, ?)`, [randomBytes(32).toString('hex'), login,email,hash,req.file.filename]
      )
      next();
      return;
    }
  }
  res.status(400).redirect("/");
};

export const authUser = async (req, res, next) => {
  if (req.body && req.body.login && req.body.password) {
    const { login, password } = req.body;
    const user = ( await connection.promise().query(`SELECT * FROM users WHERE login='${login}'`))[0][0];
    if (user && bcrypt.compareSync(password, user.password)) {
      req.body.email = user.email;
      req.body.image = user.image;
      next();
      return;
    }
  }
  return res.status(400).redirect("/");
};
