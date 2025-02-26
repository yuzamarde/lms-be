import express from "express"
import { postCourse, getCourses, updateCourse, deleteCourse, getCategories, getCourseById } from "../controllers/courseController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import multer from "multer";
import { fileFilter, fileStorageCourse } from "../utils/multer.js";

const courseRoutes = express.Router()

const upload = multer({
    storage: fileStorageCourse,
    fileFilter
})

courseRoutes.get('/courses', verifyToken, getCourses)
courseRoutes.get('/categories', verifyToken, getCategories)
courseRoutes.get('/courses/:id', verifyToken, getCourseById);
courseRoutes.post('/courses', verifyToken, upload.single('thumbnail'), postCourse);
courseRoutes.put('/courses/:id', verifyToken, upload.single('thumbnail'), updateCourse);

courseRoutes.delete('/courses/:id', verifyToken, deleteCourse);

export default courseRoutes
