import express from 'express'
import { checkDoctorLoggedIn, doctorForgot, doctorLogin, doctorLogout, resetDoctorPassword, verifyDoctorForgotOtp } from '../controllers/doctorAuthController.js';

const Router = express.Router();

Router.post("/login", doctorLogin)
Router.get("/check", checkDoctorLoggedIn)
Router.get("/logout", doctorLogout)

Router.post("/forgot", doctorForgot)
Router.post("/forgot/verify", verifyDoctorForgotOtp)
Router.post("/forgot/reset", resetDoctorPassword)


export default Router