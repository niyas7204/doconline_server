import express from 'express'
import { addEMR, editDoctorProfile, getDoctorBookings, getDoctorProfile, getDoctorSchedule, getDoctorTodayBookings, getEMR } from '../controllers/doctorController.js';

const Router = express.Router();


Router.patch('/profile', editDoctorProfile)
Router.get("/profile", getDoctorProfile)

Router.get('/booking/today', getDoctorTodayBookings)
Router.get('/bookings', getDoctorBookings)

Router.get("/schedule", getDoctorSchedule)

Router.post('/emr', addEMR)
Router.get('/emr/:bookingId', getEMR)



export default Router