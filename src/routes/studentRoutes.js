import express from "express";
import {
    deleteStudent, getCoursesStudent, getStudentById,
    getStudents, postStudent, updateStudent
} from "../controllers/studentController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import upload from "../utils/multer.js"; // Menggunakan Cloudinary

const studentRoutes = express.Router();

studentRoutes.get('/students', verifyToken, getStudents);
studentRoutes.get('/students/:id', verifyToken, getStudentById);
studentRoutes.post('/students', verifyToken, upload.single('avatar'), postStudent);
studentRoutes.put('/students/:id', verifyToken, upload.single('avatar'), updateStudent);
studentRoutes.delete('/students/:id', verifyToken, deleteStudent);

studentRoutes.get('/students-courses', verifyToken, getCoursesStudent);

export default studentRoutes;
