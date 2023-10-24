import express from 'express'
import { addDepartment, addDoctor, blockDoctor, editDepartment, editDoctor, editHospitalProfile, getBookings, getDepartments, getDoctors, getHospitalComplaints, getHospitalProfile, getHospitalReport, getSchedule, hospitalDashboard, unBlockDoctor, updateSchedule, withdrawWallet } from '../controllers/hospitalController.js';

const Router = express.Router();


Router.post("/department", addDepartment)
Router.patch("/department", editDepartment)
Router.get("/departments", getDepartments)


Router.get("/doctors", getDoctors)
Router.post("/doctor", addDoctor)
Router.patch("/doctor", editDoctor)
Router.patch("/doctor/block", blockDoctor)
Router.patch("/doctor/unblock", unBlockDoctor)
Router.patch("/doctor/schedule", updateSchedule)
Router.get("/doctor/schedule/:doctorId", getSchedule)

Router.patch("/profile", editHospitalProfile)
Router.get("/profile", getHospitalProfile)

Router.get("/booking", getBookings)

Router.get("/dashboard", hospitalDashboard)

Router.get('/complaints', getHospitalComplaints)

Router.get("/reports", getHospitalReport )

Router.post("/withdraw", withdrawWallet)



export default Router