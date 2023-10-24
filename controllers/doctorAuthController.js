import jwt from 'jsonwebtoken'
import bcrypt from "bcryptjs"
import DoctorModel from '../models/DoctorModel.js';
import crypto from 'crypto'
import sentOTP from '../helpers/sentOTP.js';

var salt = bcrypt.genSaltSync(10);


export async function doctorLogin(req, res) {
    try {
        const { email, password } = req.body;
        const doctor = await DoctorModel.findOne({ email})
        if (!doctor){
            return res.json({ err: true, message: "No Doctor Found" })
        }
        if (doctor.block)
            return res.json({ err: true, message: "You are blocked" })
        const doctorValid = bcrypt.compareSync(password, doctor.password);
        if (!doctorValid)
            return res.json({ err: true, message: "wrong Password" })
        const token = jwt.sign(
            {
                id: doctor._id
            },
            process.env.JWT_SECRET_KEY
        )
        return res.cookie("doctorToken", token, {
            httpOnly: true,
            secure: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: "none",
        }).json({ err: false })
    }
    catch (err) {
        console.log(err)
        res.json({ message: "somrthing went wrong", error: err, err:true })
    }
}


export const checkDoctorLoggedIn = async (req, res) => {
    try {
        const token = req.cookies.doctorToken;
        if (!token)
            return res.json({ loggedIn: false, error: true, message: "no token" });

        const verifiedJWT = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const doctor = await DoctorModel.findOne({_id:verifiedJWT.id, block:false}, { password: 0 });
        if (!doctor) {
            return res.json({ loggedIn: false });
        }
        if(doctor.block){
            return res.json({ loggedIn: false });
        }
        return res.json({ doctor, loggedIn: true });
    } catch (err) {
        console.log(err)
        res.json({ loggedIn: false, error: err });
    }
}

export const doctorLogout = async (req, res) => {
    res.cookie("doctorToken", "", {
        httpOnly: true,
        expires: new Date(0),
        secure: true,
        sameSite: "none",
    }).json({ message: "logged out", error: false });
}

export async function doctorForgot(req, res) {
    try {
        const { email } = req.body;
        const user = await DoctorModel.findOne({ email });
        if (!user) {
            return res.json({ err: true, message: "no doctor found" })
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
        return res.cookie("tempDoctorToken", token, {
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
export async function verifyDoctorForgotOtp(req, res) {
    try {
        const { otp } = req.body;
        const tempToken = req.cookies.tempDoctorToken;

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

export async function resetDoctorPassword(req, res) {
    try {
        const { email, password, otp } = req.body;
        const tempToken = req.cookies.tempDoctorToken;

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


        await DoctorModel.updateOne({ email }, {
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