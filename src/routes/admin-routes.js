import { Router } from "express";
import multer from "multer";
import { connection } from "../server.js";
import bcrypt from "bcrypt";
import path from "node:path";
import {randomBytes} from 'crypto';

const storage = multer.diskStorage({
    destination: "photos/",
    filename: (req, file, cb) => {
      cb(null, req.body.login + path.extname(file.originalname));
    },
  });
  const configMulter = multer({ storage: storage });

const adminRoutes = Router();

adminRoutes.
    route("/editUser/:login")
    .get( async (req,res)=>{
        const login = Array.from(req.params.login).filter(el => el !== ':').toString().replaceAll(',', '');
        const user = (await connection.promise().query(`SELECT * FROM users WHERE login='${login}'`))[0][0];
        res.render("users_edit", {user});
    })
    .post(configMulter.single("image"), async (req,res)=>{
        if(req.body && req.body.login && req.body.email){
            let values = [`login='${req.body.login}'`, `email='${req.body.email}'`];
            if(req.body.password){
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(req.body.password, salt);
                values.push(`password='${hash}'`);
            }
            if(req.file){
                values.push(`image='${req.file.filename}'`);
            }
            let query = 'UPDATE users SET ';
            for(let i = 0; i < values.length; i++){
                query += values[i];
                if(i !==values.length-1){
                    query += ', ';
                }
            }
            query += ` WHERE login='${ Array.from(req.params.login).filter(el => el !== ':').toString().replaceAll(',', '')}'`;
            console.log(query);
            await connection.promise().query(query);
            res.redirect("/user/admin");
        }
    })


adminRoutes
    .route("/deleteUser/:login")
    .post(async (req,res)=> {
        const login = Array.from(req.params.login).filter(el => el !== ':').toString().replaceAll(',', '');
        await connection.promise().query(`DELETE FROM users WHERE login='${login}'`);
        await connection.promise().query(
            `DELETE FROM sessions WHERE JSON_UNQUOTE(JSON_EXTRACT(data, '$.user.login')) = ?`,
            [login]
        );
        res.redirect("/user/admin");
    })

adminRoutes
    .route('/addUser')
    .get((req,res)=> {
        res.render("users_add");
    })
    .post(configMulter.single("image"), async (req,res)=> {      
        if(req.body && req.body.login && req.body.email && req.body.password && req.file){
            const ifExist = (await connection.promise().query(`SELECT * FROM users WHERE login='${req.body.login}'`))[0][0];
            console.log(ifExist);
            if(!ifExist){ 
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(req.body.password, salt);
                await connection.promise().query(
                    `INSERT INTO users (id, login, email, password, image) VALUES (?, ?, ?, ?, ?)`, [randomBytes(32).toString('hex'), req.body.login,req.body.email, hash,req.file.filename]
            )}
        }
        res.redirect("/user/admin");
    })
    
export default adminRoutes;