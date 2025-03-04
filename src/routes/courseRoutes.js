import express from "express"
import { postCourse, getCourses, updateCourse, deleteCourse, getCategories, getCourseById, postContentCourse, updateContentCourse, deleteContentCourse, getDetailContent, getStudentsByCourseId, postStudentToCourse, deleteStudentToCourse } from "../controllers/courseController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import multer from "multer";
import upload from "../utils/multer.js"; // Menggunakan Cloudinary
import { addStudentCourseSchema, mutateContentSchema } from "../utils/schema.js";
import { validateRequest } from "../middlewares/validateRequest.js";

const courseRoutes = express.Router()



courseRoutes.get('/courses', verifyToken, getCourses)
courseRoutes.get('/categories', verifyToken, getCategories)
courseRoutes.get('/courses/:id', verifyToken, getCourseById);
courseRoutes.post('/courses', verifyToken, upload.single('thumbnail'), postCourse);
courseRoutes.put('/courses/:id', verifyToken, upload.single('thumbnail'), updateCourse);
courseRoutes.delete('/courses/:id', verifyToken, deleteCourse);

courseRoutes.post('/courses/contents', verifyToken, validateRequest(mutateContentSchema), postContentCourse);
courseRoutes.put('/courses/contents/:id', verifyToken, validateRequest(mutateContentSchema), updateContentCourse);
courseRoutes.delete('/courses/contents/:id', verifyToken, deleteContentCourse);
courseRoutes.get('/courses/contents/:id', verifyToken, getDetailContent);

courseRoutes.get('/courses/students/:id', verifyToken, getStudentsByCourseId)
courseRoutes.post('/courses/students/:id', verifyToken, validateRequest(addStudentCourseSchema), postStudentToCourse)
courseRoutes.put('/courses/students/:id', verifyToken, validateRequest(addStudentCourseSchema), deleteStudentToCourse)

export default courseRoutes
