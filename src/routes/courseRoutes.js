import express from "express"
import { postCourse, getCourses, updateCourse, deleteCourse, getCategories, getCourseById, postContentCourse, updateContentCourse, deleteContentCourse } from "../controllers/courseController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import multer from "multer";
import { fileFilter, fileStorageCourse } from "../utils/multer.js";
import { mutateContentSchema } from "../utils/schema.js";
import { validateRequest } from "../middlewares/validateRequest.js";

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

courseRoutes.post('/courses/contents', verifyToken, validateRequest(mutateContentSchema), postContentCourse);
courseRoutes.put('/courses/contents/:id', verifyToken, validateRequest(mutateContentSchema), updateContentCourse);
courseRoutes.delete('/courses/contents/:id', verifyToken, deleteContentCourse);

export default courseRoutes
