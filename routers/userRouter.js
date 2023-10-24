import express from 'express';
import { paymentOrder, verifyPayment } from '../controllers/paymentController.js';
import { addComplaint, addDoctorFeedback, addHospitalrFeedback, cancelBooking, checkTimeSlot, getAllDepartments, getAllDoctors, getAllHospitals, getDoctor, getDoctorSchedule, getHospital, getTop3Doctors, getTop3Hospitals, getUserBookings, getUserEMR } from '../controllers/userController.js';

const router=express.Router();

router.get("/departments", getAllDepartments)
router.get("/hospitals", getAllHospitals)
router.get("/hospitals/top", getTop3Hospitals)

router.get("/doctors", getAllDoctors)
router.get("/doctors/top", getTop3Doctors)

router.get("/hospital/:id", getHospital)

router.get("/doctor/:id", getDoctor)

router.post("/payment", paymentOrder)
router.post("/payment/verify", verifyPayment)

router.post('/check-time', checkTimeSlot)
router.get("/doctor/schedule/:doctorId", getDoctorSchedule)

router.get("/booking", getUserBookings)
router.patch("/booking/cancel", cancelBooking )


router.post('/feedback/doctor', addDoctorFeedback)
router.post('/feedback/hospital', addHospitalrFeedback)

router.post("/complaint", addComplaint)
router.get('/emr/:bookingId', getUserEMR)






export default router