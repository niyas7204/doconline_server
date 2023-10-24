import jwt from 'jsonwebtoken'
import bcrypt from "bcryptjs"
import HospitalModel from '../models/HospitalModel.js';
import cloudinary from '../config/cloudinary.js';
import crypto from 'crypto'
import sentOTP from '../helpers/sentOTP.js';



var salt = bcrypt.genSaltSync(10);


export async function hospitalRegister(req, res){
    try{
        const {name, email, mobile, password}=req.body;
        const proof=await cloudinary.uploader.upload(req.body.proof,{
            folder:'docOnline'
        })
        const hashPassword = bcrypt.hashSync(password, salt);
        const hospital = await HospitalModel.create({...req.body,password:hashPassword, proof});
        const token = jwt.sign(
            {
                id: hospital._id
            },
            process.env.JWT_SECRET_KEY
        )
        return res.cookie("hospitalToken", token, {
            httpOnly: true,
            secure: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: "none",
        }).json({ err: false })

    }catch(err){
        res.json({err:true , error:err, message:"Something Went Wrong"})
    }

}

export async function hospitalLogin(req, res) {
    try {
        const { email, password } = req.body;
        const hospital = await HospitalModel.findOne({ email})
        if (!hospital){
            return res.json({ err: true, message: "No Hospital Found" })
        }
        if (hospital.block){
            return res.json({ err: true, message: "Hospital is blocked" })
        }
        // if (!hospital.active){
        //     return res.json({ err: true, message: "Approval under process. We will inform you once completed" })
        // }
    
        const hospitalValid = bcrypt.compareSync(password, hospital.password);
        if (!hospitalValid)
            return res.json({ err: true, message: "wrong Password" })
        const token = jwt.sign(
            {
                id: hospital._id
            },
            process.env.JWT_SECRET_KEY
        )
        return res.cookie("hospitalToken", token, {
            httpOnly: true,
            secure: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: "none",
        }).json({ err: false })
    }
    catch (err) {
        res.json({ message: "somrthing went wrong", error: err, err:true })
    }
}


export const checkHospitalLoggedIn = async (req, res) => {
    try {
        const token = req.cookies.hospitalToken;
        if (!token)
            return res.json({ loggedIn: false, error: true, message: "no token" });

        const verifiedJWT = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const hospital = await HospitalModel.findOne({_id:verifiedJWT.id, block:false}, { password: 0 });
        if (!hospital) {
            return res.json({ loggedIn: false });
        }
        return res.json({ hospital, loggedIn: true });
    } catch (err) {
        console.log(err)
        res.json({ loggedIn: false, error: err });
    }
}

export const hospitalLogout = async (req, res) => {
    res.cookie("hospitalToken", "", {
        httpOnly: true,
        expires: new Date(0),
        secure: true,
        sameSite: "none",
    }).json({ message: "logged out", error: false });
}

export async function hospitalForgot(req, res) {
    try {
        const { email } = req.body;
        const user = await HospitalModel.findOne({ email });
        if (!user) {
            return res.json({ err: true, message: "hospital not found" })
        }
        let otp = Math.ceil(Math.random() * 1000000)
        let otpHash = crypto.createHmac('sha256', process.env.OTP_SECRET)
            .update(otp.toString())
            .digest('hex');
        let otpSent = await sentOTP(email, otp)
        const token = jwt.sign(
            {
                otp: otpHash
            },
            process.env.JWT_SECRET_KEY
        )
        return res.cookie("tempHospitalToken", token, {
            httpOnly: true,
            secure: true,
            maxAge: 1000 * 60 * 10,
            sameSite: "none",
        }).json({ err: false })
    }
    catch (err) {
        console.log(err)
        res.json({ err: true, error: err, message: "something went wrong" })
    }
}
export async function verifyHospitalForgotOtp(req, res) {
    try {
        const { otp } = req.body;
        const tempToken = req.cookies.tempHospitalToken;

        if (!tempToken) {
            return res.json({ err: true, message: "OTP Session Timed Out" });
        }

        const verifiedTempToken = jwt.verify(tempToken, process.env.JWT_SECRET_KEY);
        let otpHash = crypto.createHmac('sha256', process.env.OTP_SECRET)
            .update(otp.toString())
            .digest('hex');
        if (otpHash != verifiedTempToken.otp) {
            return res.json({ err: true, message: "Invalid OTP" });
        }
        return res.json({ err: false })
    }
    catch (err) {
        console.log(err)
        res.json({ error: err, err: true, message: "something went wrong" })
    }
}

export async function resetHospitalPassword(req, res) {
    try {
        const { email, password, otp } = req.body;
        const tempToken = req.cookies.tempHospitalToken;

        if (!tempToken) {
            return res.json({ err: true, message: "OTP Session Timed Out" });
        }

        const verifiedTempToken = jwt.verify(tempToken, process.env.JWT_SECRET_KEY);
        let otpHash = crypto.createHmac('sha256', process.env.OTP_SECRET)
            .update(otp.toString())
            .digest('hex');
        if (otpHash != verifiedTempToken.otp) {
            return res.json({ err: true, message: "Invalid OTP" });
        }
        const hashPassword = bcrypt.hashSync(password, salt);


        await HospitalModel.updateOne({ email }, {
            $set: {
                password: hashPassword
            }
        })
        return res.cookie("tempHospitalToken", "", {
            httpOnly: true,
            expires: new Date(0),
            secure: true,
            sameSite: "none",
        }).json({ err: false })
    }
    catch (err) {
        console.log(err)
        res.json({ error: err, err: true, message: "something went wrong" })
    }
}

export async function hospitalReApply(req, res){
    try{
        const {image, name, about, address, place, mobile, hospitalId}= req.body;
        if(image){
            const data=await cloudinary.uploader.upload(image,{
                folder:'docOnline'
            })
            await HospitalModel.findByIdAndUpdate(hospitalId, {$set:{proof:data,
                name, about, address, place, mobile, rejected:false
            }})
        }else{ 
            await HospitalModel.findByIdAndUpdate(hospitalId, {$set:{
                name, about, address, place, mobile, rejected:false
            }})
        }
        res.json({result:data, err:false})

    }catch(error){
        console.log(error);
        res.json({err:true, error, message:"something went wrong"})
    }
}
