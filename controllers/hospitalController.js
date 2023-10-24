import sentMail from "../helpers/sentMail.js";
import DoctorModel from "../models/DoctorModel.js";
import bcrypt from "bcryptjs"
import HospitalModel from "../models/HospitalModel.js"
import DepartmentModel from "../models/DepartmentModel.js";
import ScheduleModel from "../models/ScheduleModel.js";
import cloudinary from '../config/cloudinary.js'
import BookingModel from "../models/BookingModel.js";
import FeedbackModel from "../models/FeedbackModel.js";
import ComplaintModel from "../models/ComplaintModel.js";
import EMRModel from "../models/EMRModel.js";
import WithdrawModel from "../models/WithdrawModel.js";

var salt = bcrypt.genSaltSync(10);


export async function hospitalDashboard(req, res) {
    try {
        const totalDoctors = await DoctorModel.find({ hospitalId: req.hospital._id }).count();
        const booking = await BookingModel.aggregate([
            { $match: { hospitalId: req.hospital._id } },
            { $group: { _id: "totalBokingDetails", totalBooking: { $sum: 1 }, totalRevenue: { $sum: "$fees" } } }
        ])
        const monthlyDataArray = await BookingModel.aggregate([{ $match: { hospitalId: req.hospital._id } },{ $group: { _id: { $month: "$date" }, totalRevenue: { $sum: "$fees" } } }])
        let monthlyDataObject = {}
        monthlyDataArray.map(item => {
            monthlyDataObject[item._id] = item.totalRevenue
        })
        let monthlyData = []
        for (let i = 1; i <= 12; i++) {
            monthlyData[i - 1] = monthlyDataObject[i] ?? 0
        }
        res.json({ err: false, totalDoctors, booking: booking[0], monthlyData })
    }
    catch (err) {
        console.log(err)
        res.json({ message: "somrthing went wrong", error: err, err: true })
    }
}
export async function addDepartment(req, res) {
    try {
        const department = await DepartmentModel.findOne({
            name:req.body.department.trim().toLowerCase(),
            hospitalId:req.hospital._id
        })
        if(department){
            return req.json({
                err:true, message:"Department Already Exist"
            })
        }
        await DepartmentModel.updateOne({ name: req.body.department.trim().toLowerCase() }, { $set: { name: req.body.department.trim().toLowerCase() }, $addToSet: { hospitalId: req.hospital._id } }, { upsert: true })
        res.json({ err: false })
    }
    catch (err) {
        res.json({ message: "somrthing went wrong", error: err, err: true })
    }
}
export async function editDepartment(req, res) {
    try {
        const department = await DepartmentModel.findOne({
            name:req.body.department.trim().toLowerCase(),
            hospitalId:req.hospital._id
        })
        if(department){
            return req.json({
                err:true, message:"Department Already Exist"
            })
        }
        await DepartmentModel.findByIdAndUpdate(req.body.id, { $set: { name: req.body.department.trim().toLowerCase() } })
        res.json({ err: false })
    }
    catch (err) {
        res.json({ message: "somrthing went wrong", error: err, err: true })
    }
}

export async function getDepartments(req, res) {
    try {
        const name = req.query.name ?? ""
        let departments = await DepartmentModel.find({ hospitalId: req.hospital._id, name: new RegExp(name, 'i') }).lean()
        res.json({ err: false, departments })
    }
    catch (err) {
        res.json({ message: "somrthing went wrong", error: err, err: true })
    }
}

export async function getDoctors(req, res) {
    try {
        const name = req.query.name ?? ""
        let doctors = await DoctorModel.find({ hospitalId: req.hospital._id, name: new RegExp(name, 'i') }).lean()
        res.json({ err: false, doctors })
    }
    catch (err) {
        res.json({ message: "somrthing went wrong", error: err, err: true })
    }
}

export async function addDoctor(req, res) {
    try {
        const { password } = req.body;
        const hashPassword = bcrypt.hashSync(password, salt);
        const doctor = await DoctorModel.create({ ...req.body, password: hashPassword, hospitalId: req.hospital._id });
        res.json({ err: false })

    } catch (err) {
        console.log(err)
        res.json({ err: true, error: err, message: "Something Went Wrong" })
    }

}
export async function editDoctor(req, res) {
    try {
        const doctor = await DoctorModel.updateOne({ _id: req.body._id }, { $set: { ...req.body, hospitalId: req.hospital._id } });
        res.json({ err: false })

    } catch (err) {
        console.log(err)
        res.json({ err: true, error: err, message: "Something Went Wrong" })
    }

}
export async function blockDoctor(req, res) {
    try {
        await DoctorModel.updateOne({ _id: req.body.id }, { $set: { block: true } });
        res.json({ err: false })

    } catch (err) {
        console.log(err)
        res.json({ err: true, error: err, message: "Something Went Wrong" })
    }

}
export async function unBlockDoctor(req, res) {
    try {
        await DoctorModel.updateOne({ _id: req.body.id }, { $set: { block: false } });
        res.json({ err: false })

    } catch (err) {
        console.log(err)
        res.json({ err: true, error: err, message: "Something Went Wrong" })
    }

}
export async function updateSchedule(req, res) {
    try {
        // res.json(req.body)
        const { doctorId } = req.body;
        await ScheduleModel.updateOne({ doctorId }, {
            $set: {
                ...req.body
            }
        }, { upsert: true })

        res.json({ err: false })

    } catch (err) {
        console.log(err)
        res.json({ err: true, error: err, message: "Something Went Wrong" })
    }

}

export async function getSchedule(req, res) {
    try {
        const { doctorId } = req.params;
        const schedule = await ScheduleModel.findOne({ doctorId });
        if (schedule) {
            return res.json({ err: false, schedule })
        } else {
            return res.json({
                err: false, schedule: {
                    mon: [],
                    tue: [],
                    wed: [],
                    thu: [],
                    fri: [],
                    sat: [],
                    sun: []
                }
            })
        }
    } catch (err) {
        console.log(err)
        res.json({ err: true, error: err, message: "Something Went Wrong" })
    }
}
export async function editHospitalProfile(req, res) {
    try {
        const { image, name, about, address, place, mobile } = req.body;
        if (image) {
            const data = await cloudinary.uploader.upload(image, {
                folder: 'docOnline'
            })
            await HospitalModel.findByIdAndUpdate(req.hospital._id, {
                $set: {
                    image: data,
                    name, about, address, place, mobile
                }
            })
        } else {
            await HospitalModel.findByIdAndUpdate(req.hospital._id, {
                $set: {
                    name, about, address, place, mobile
                }
            })
        }
        res.json({ result: data, err: false })

    } catch (error) {
        console.log(error);
        res.json({ err: true, error, message: "something went wrong" })
    }
}

export async function getBookings(req, res) {
    try {
        const bookings = await BookingModel.find({
            hospitalId: req.hospital._id,
            patientName: new RegExp(req.query.name, 'i')
        }).populate('doctorId').sort({ _id: -1 })
        return res.json({ err: false, bookings })

    } catch (error) {
        console.log(error)
        res.json({ err: true, error, message: "something went wrong" })
    }
}

export async function getHospitalProfile(req, res) {
    try {

        let totalRating = 0;

        const reviews = await FeedbackModel.find({
            hospitalId: req.hospital._id
        }).populate('userId').lean()

        for (let item of reviews) {
            totalRating += item.rating
        }
        let reviewCount = reviews.length != 0 ? reviews.length : 1;
        const rating = totalRating / reviewCount;
        // const hospital = await HospitalModel.findById(req.hospital._id, { password: 0 });
        const departments = await DepartmentModel.find({ hospitalId: req.hospital._id }, { password: 0 });
        res.json({
            err: false, hospital: req.hospital, departments,
            rating, reviews
        })

    } catch (error) {
        console.log(error)
        res.json({ err: true, error, message: "something went wrong" })
    }
}

export async function getHospitalComplaints(req, res) {
    try {
        const complaints = await ComplaintModel.aggregate([
            {
                $lookup: {
                    from: "doctors",
                    localField: "doctorId",
                    foreignField: "_id",
                    as: 'doctor'
                }
            },
            { $unwind: "$doctor" },
            {
                $match: {
                    'doctor.hospitalId': req.hospital._id
                }
            },
            {
                $sort: {
                    _id: -1
                }
            }
        ])
        res.json({
            err: false,
            complaints
        })

    } catch (error) {
        console.log(error)
        res.json({ err: true, error, message: "something went wrong" })
    }
}

export async function getHospitalReport(req, res) {
    try {
        let startDate = new Date(new Date().setDate(new Date().getDate() - 8))
        let endDate = new Date()

        if (req.query.startDate) {
            startDate = new Date(Number(req.query.startDate))
            startDate.setHours(0, 0, 0, 0);
        }
        if (req.query.endDate) {
            endDate = new Date(Number(req.query.endDate))
            endDate.setHours(24, 0, 0, 0);
        }

        if (req.query.filter == 'thisYear') {
            let currentDate = new Date()
            startDate = new Date(currentDate.getFullYear(), 0, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(currentDate.getFullYear(), 11, 31);
            endDate.setHours(0, 0, 0, 0);
        }
        if (req.query.filter == 'lastYear') {
            let currentDate = new Date()
            startDate = new Date(currentDate.getFullYear() - 1, 0, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(currentDate.getFullYear() - 1, 11, 31);
            endDate.setHours(0, 0, 0, 0);
        }
        if (req.query.filter == 'thisMonth') {
            let currentDate = new Date()
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            endDate.setHours(0, 0, 0, 0);
        }
        if (req.query.filter == 'lastMonth') {
            let currentDate = new Date()
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            endDate.setHours(0, 0, 0, 0);
        }

        const totalBookings = await BookingModel
            .find({ date: { $gt: startDate, $lt: endDate }, hospitalId: req.hospital._id })
            .count()
        const totalCount = await BookingModel.aggregate([
            {
                $match: { date: { $gt: startDate, $lt: endDate }, hospitalId: req.hospital._id }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ])
        const byDepartment = await BookingModel.aggregate([
            {
                $match:
                    { date: { $gt: startDate, $lt: endDate }, hospitalId: req.hospital._id }
            },
            {
                $lookup: {
                    from: "doctors",
                    localField: "doctorId",
                    foreignField: "_id",
                    as: 'doctor'
                }
            },
            { $unwind: "$doctor" },
            { $group: { _id: "$doctor.department", totalProfit: { $sum: "$doctor.fees" }, count: { $sum: 1 } } },
            {
                $lookup: {
                    from: "departments",
                    localField: "_id",
                    foreignField: "_id",
                    as: 'department'
                }
            },
            { $unwind: "$department" }
        ])
        const byDoctor = await BookingModel.aggregate([
            {
                $match:
                    { date: { $gt: startDate, $lt: endDate }, hospitalId: req.hospital._id }
            },
            {
                $lookup: {
                    from: "doctors",
                    localField: "doctorId",
                    foreignField: "_id",
                    as: 'doctor'
                }
            },
            { $unwind: "$doctor" },
            { $group: { _id: { id: "$doctorId", doctorName: '$doctor.name' }, totalProfit: { $sum: "$doctor.fees" }, count: { $sum: 1 } } },
        ])

        res.json({
            totalCount: [...totalCount, { _id: "booking", count: totalBookings }],
            byDepartment,
            byDoctor,
            startDate: new Date(startDate),
            endDate: new Date(new Date(endDate).setDate(new Date(endDate).getDate() - 1))
        })
    }catch(error){
        console.log(error)
        res.json({error, err:true, message:"something went wrong"})
    }

}

export async function withdrawWallet(req, res){
    try{
        const {accountHolder, accountNo, branch, ifsc} = req.body;
        if (branch.trim() === "" || accountHolder.trim()==="" || ifsc.trim().length!==11) {
            return res.json({err:true, message:"all fields required"})
        }
        if(accountNo.toString().length <12 || accountNo.toString.length>17){
            return res.json({err:true, message:"Account number must be between 12 and 17"})
        }
        const withdraw= await WithdrawModel.create({
            accountHolder, accountNo,branch, ifsc, hospitalId:req.hospital._id
        })
        res.json({err:false})

    }catch(error){
        console.log(error)
        res.json({error, err:true, message:"something went wrong"})
    }
}