import sentAppointmentReminder from "../helpers/sentAppointmentReminder.js";
import sentNotification from "../helpers/sentAppointmentReminder.js";
import sentMail from "../helpers/sentMail.js";
import BookingModel from "../models/BookingModel.js";
import ComplaintModel from "../models/ComplaintModel.js";
import DepartmentModel from "../models/DepartmentModel.js";
import DoctorModel from "../models/DoctorModel.js";
import HospitalModel from "../models/HospitalModel.js";
import UserModel from "../models/UserModel.js";
import WithdrawModel from "../models/WithdrawModel.js";
import cron from "node-cron";
import Razorpay from 'razorpay'

let instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

cron.schedule('0 0 0 * * *', async () => {
  try {
    const date = new Date();
    date.setDate(date.getDate() + 1);

    const startDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0
    );
    const endDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59
    );
    const bookings = await BookingModel.find({
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    }).populate("userId").populate('doctorId');
    for (let item of bookings) {
      console.log(item.date, item.time);
      let date = new Date(item.date).toLocaleDateString();
      let time = new Date(item.time).toLocaleTimeString();
      (async function () {
        await sentAppointmentReminder(item.userId.email, date, time, item.doctorId.name);
      })();
    }
  } catch (err) {
    console.log(err);
  }
})
// cron.schedule('0 0 0 * * *', async() => {

// });

export async function adminDashboard(req, res) {
  try {
    const totalDoctors = await DoctorModel.find().count();
    const booking = await BookingModel.aggregate([
      {
        $group: {
          _id: "totalBokingDetails",
          totalBooking: { $sum: 1 },
          totalRevenue: { $sum: "$fees" },
        },
      },
    ]);
    const monthlyDataArray = await BookingModel.aggregate([
      { $group: { _id: { $month: "$date" }, totalRevenue: { $sum: "$fees" } } },
    ]);
    let monthlyDataObject = {};
    monthlyDataArray.map((item) => {
      monthlyDataObject[item._id] = item.totalRevenue;
    });
    let monthlyData = [];
    for (let i = 1; i <= 12; i++) {
      monthlyData[i - 1] = monthlyDataObject[i] ?? 0;
    }
    res.json({ err: false, totalDoctors, booking: booking[0], monthlyData });
  } catch (err) {
    console.log(err);
    res.json({ message: "somrthing went wrong", error: err, err: true });
  }
}

export async function getHospitalRequests(req, res) {
  try {
    const doctorRequests = await HospitalModel.find({
      active: false,
      rejected: { $ne: true },
    }).lean();
    res.json({ err: false, doctorRequests });
  } catch (err) {
    res.json({ message: "somrthing went wrong", error: err, err: true });
  }
}
export async function acceptHospital(req, res) {
  try {
    const { email } = req.body;
    await HospitalModel.updateOne({ email }, { active: true });
    res.json({ err: false });
    await sentMail(
      email,
      "Doc online has approved your request for registration",
      "You can proceed to your account"
    );
  } catch (err) {
    res.json({ message: "somrthing went wrong", error: err, err: true });
  }
}
export async function rejectHospital(req, res) {
  try {
    const { email } = req.body;
    await HospitalModel.updateOne({ email }, { active: false, rejected: true });

    res.json({ err: false });
    await sentMail(
      email,
      "Doc online has rejected your request for registration",
      "Please try again sometimes"
    );
  } catch (err) {
    res.json({ message: "somrthing went wrong", error: err, err: true });
  }
}

export async function getDepartments(req, res) {
  try {
    const name = req.query.name ?? "";
    let departments = await DepartmentModel.find({
      name: new RegExp(name, "i"),
    }).lean();
    res.json({ err: false, departments });
  } catch (err) {
    res.json({ message: "somrthing went wrong", error: err, err: true });
  }
}

export async function getHospitals(req, res) {
  try {
    const name = req.query.name ?? "";
    let hospitals = await HospitalModel.find({
      active: true,
      name: new RegExp(name, "i"),
    }).lean();
    res.json({ err: false, hospitals });
  } catch (err) {
    res.json({ message: "somrthing went wrong", error: err, err: true });
  }
}

export async function getDoctors(req, res) {
  try {
    const name = req.query.name ?? "";
    let doctors = await DoctorModel.find({ name: new RegExp(name, "i") })
      .populate("department")
      .populate("hospitalId")
      .lean();
    res.json({ err: false, doctors });
  } catch (err) {
    res.json({ message: "somrthing went wrong", error: err, err: true });
  }
}

export async function getUsers(req, res) {
  try {
    const name = req.query.name ?? "";
    let users = await UserModel.find({ name: new RegExp(name, "i") }).lean();
    res.json({ err: false, users });
  } catch (err) {
    res.json({ message: "something went wrong", error: err, err: true });
  }
}

export async function blockHospital(req, res) {
  try {
    await HospitalModel.findByIdAndUpdate(req.body.id, {
      $set: { block: true },
    }).lean();
    res.json({ err: false });
  } catch (err) {
    res.json({ message: "something went wrong", error: err, err: true });
  }
}

export async function unBlockHospital(req, res) {
  try {
    await HospitalModel.findByIdAndUpdate(req.body.id, {
      $set: { block: false },
    }).lean();
    res.json({ err: false });
  } catch (err) {
    res.json({ message: "something went wrong", error: err, err: true });
  }
}

export async function blockUser(req, res) {
  try {
    await UserModel.findByIdAndUpdate(req.body.id, {
      $set: { block: true },
    }).lean();
    res.json({ err: false });
  } catch (err) {
    res.json({ message: "something went wrong", error: err, err: true });
  }
}

export async function unBlockUser(req, res) {
  try {
    await UserModel.findByIdAndUpdate(req.body.id, {
      $set: { block: false },
    }).lean();
    res.json({ err: false });
  } catch (err) {
    res.json({ message: "something went wrong", error: err, err: true });
  }
}
export async function getAdminComplaints(req, res) {
  try {
    const complaints = await ComplaintModel.find({})
      .populate("userId")
      .populate("doctorId")
      .populate("hospitalId")
      .sort({ _id: -1 });
    return res.json({ err: false, complaints });
  } catch (error) {
    console.log(error);
    res.json({ err: true, error, message: "something went wrong" });
  }
}

export async function getAdminReport(req, res) {
  try {
    let startDate = new Date(new Date().setDate(new Date().getDate() - 8));
    let endDate = new Date();

    if (req.query.startDate) {
      startDate = new Date(Number(req.query.startDate));
      startDate.setHours(0, 0, 0, 0);
    }
    if (req.query.endDate) {
      endDate = new Date(Number(req.query.endDate));
      endDate.setHours(24, 0, 0, 0);
    }
    if (req.query.filter == "lastWeek") {
      let startDate = new Date(new Date().setDate(new Date().getDate() - 8));
      startDate.setHours(0, 0, 0, 0);
      let endDate = new Date();
      endDate.setHours(0, 0, 0, 0);
    }
    if (req.query.filter == "thisYear") {
      let currentDate = new Date();
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(currentDate.getFullYear(), 11, 31);
      endDate.setHours(0, 0, 0, 0);
    }
    if (req.query.filter == "lastYear") {
      let currentDate = new Date();
      startDate = new Date(currentDate.getFullYear() - 1, 0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(currentDate.getFullYear() - 1, 11, 31);
      endDate.setHours(0, 0, 0, 0);
    }
    if (req.query.filter == "thisMonth") {
      let currentDate = new Date();
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      );
      endDate.setHours(0, 0, 0, 0);
    }
    if (req.query.filter == "lastMonth") {
      let currentDate = new Date();
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      );
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate.setHours(0, 0, 0, 0);
    }

    const totalBookings = await BookingModel.find({
      date: { $gt: startDate, $lt: endDate },
    }).count();
    const totalCount = await BookingModel.aggregate([
      {
        $match: { date: { $gt: startDate, $lt: endDate } },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    const byDepartment = await BookingModel.aggregate([
      {
        $match: { date: { $gt: startDate, $lt: endDate } },
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: "$doctor" },
      {
        $group: {
          _id: "$doctor.department",
          totalProfit: { $sum: "$doctor.fees" },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "department",
        },
      },
      { $unwind: "$department" },
    ]);
    const byDoctor = await BookingModel.aggregate([
      {
        $match: { date: { $gt: startDate, $lt: endDate } },
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: "$doctor" },
      {
        $group: {
          _id: { id: "$doctorId", doctorName: "$doctor.name" },
          totalProfit: { $sum: "$doctor.fees" },
          count: { $sum: 1 },
        },
      },
    ]);
    res.json({
      totalCount: [...totalCount, { _id: "booking", count: totalBookings }],
      byDepartment,
      byDoctor,
      startDate: new Date(startDate),
      endDate: new Date(
        new Date(endDate).setDate(new Date(endDate).getDate() - 1)
      ),
    });
  } catch (error) {
    console.log(error);
    res.json({ error, err: true, message: "something went wrong" });
  }
}
export async function getBookingRefunds(req, res) {
  try {
    const bookings = await BookingModel.find({
      status: "refund processing",
    }).lean();
    return res.json({
      err: false,
      bookings,
    });
  } catch (error) {
    console.log(error);
    res.json({ err: true, error, message: "something went wrong" });
  }
}
export async function refundComplete(req, res) {
  try {
    const { id } = req.body;
    const booking= await BookingModel.findById(id);
    if(!booking){
      return res.json({err:true, message:"No booking found"})
    }
    const paymentId=booking.payment.razorpay_payment_id;
    const payment = await instance.payments.fetch(paymentId);
    if (payment.amount_refunded) {
      return res.json({err:true, message:"Payment has been refunded."})
    }
    const result= await instance.payments.refund(paymentId,{
      "amount": booking.fees,
      "speed": "normal",
      "notes": {
        "notes_key_1": "Thank you for using doconline",
      }
    })
    await BookingModel.findByIdAndUpdate(id, {
      $set: {
        status: "cancelled",
      },
    });
    return res.json({
      err: false,
    });
  } catch (error) {
    console.log(error);
    res.json({ err: true, error, message: "something went wrong" });
  }
}

export async function getWithdrawals(req, res) {
  try {
    const withdrawals = await WithdrawModel.find()
      .populate("hospitalId")
      .sort({ _id: -1 });
    res.json({ withdrawals, err: false });
  } catch (error) {
    console.log(error);
    res.json({ err: true, error, message: "something went wrong" });
  }
}

export async function completeWithdraw(req, res) {
  try {
    const withdraws = await WithdrawModel.updateOne(
      { hospitalId: req.body.id },
      {
        $set: {
          status: true,
        },
      }
    );
    const walletUpdate = await HospitalModel.findByIdAndUpdate(req.body.id, {
      $set: {
        wallet: 0,
      },
    });
    res.json({ err: false });
  } catch (error) {
    console.log(error);
    res.json({ err: true, error, message: "something went wrong" });
  }
}
