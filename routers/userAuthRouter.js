import express from 'express';
import { checkUserLoggedIn,userForgot,verifyForgotOtp,resetUserPassword, userLogin, userLogout, userRegister, userRegisterVerify, googleAuthRedirect, verifyGAuth } from '../controllers/userAuthController.js';

const router=express.Router();

router.post("/login", userLogin)
router.post("/register", userRegister)
router.post("/register/verify", userRegisterVerify)
router.get("/check", checkUserLoggedIn)
router.get("/logout", userLogout)

router.post("/forgot", userForgot)
router.post("/forgot/verify", verifyForgotOtp)
router.post("/forgot/reset", resetUserPassword)

router.get( '/google/callback', googleAuthRedirect );
router.get( '/google/verify', verifyGAuth );

export default router