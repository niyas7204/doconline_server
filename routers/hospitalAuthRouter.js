import express from 'express'
import { checkHospitalLoggedIn, hospitalForgot, hospitalLogin, hospitalLogout, hospitalReApply, hospitalRegister, resetHospitalPassword, verifyHospitalForgotOtp } from '../controllers/hospitalAuthController.js';

const Router = express.Router();

Router.post("/register", hospitalRegister)
Router.post("/login", hospitalLogin)
Router.get("/check", checkHospitalLoggedIn)
Router.get("/logout", hospitalLogout)

Router.post("/forgot", hospitalForgot)
Router.post("/forgot/verify", verifyHospitalForgotOtp)
Router.post("/forgot/reset", resetHospitalPassword)

Router.patch("/reapply/", hospitalReApply)


export default Router