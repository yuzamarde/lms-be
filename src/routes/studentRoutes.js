import express from "express"
import { deleteStudent, getStudents, postStudent, updateStudent } from "../controllers/studentController.js"
import { verifyToken } from "../middlewares/verifyToken.js"
import multer from "multer"
import { fileStorage, fileFilter } from "../utils/multer.js"

const studentRoutes = express.Router()

const upload = multer({
    storage: fileStorage('students'),
    fileFilter
})

studentRoutes.get('/students', verifyToken, getStudents)
studentRoutes.post('/students', verifyToken, upload.single('avatar'), postStudent)
studentRoutes.put('/students/:id', verifyToken, upload.single('avatar'), updateStudent)
studentRoutes.delete('/students/:id', verifyToken, deleteStudent)

export default studentRoutes