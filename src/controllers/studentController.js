import userModel from "../models/userModel.js"
import bcrypt from 'bcrypt';
import fs from 'fs';
import { mutateStudentSchema } from "../utils/schema.js";

export const getStudents = async (req, res) => {
    try {
        const students = await userModel.find({
            role: 'student',
            manager: req.user._id
        })

        return res.json({
            message: 'Get Student success',
            data: students
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
        });

    }
}

export const postStudent = async (req, res) => {
    try {
        const body = req.body
        const parse = mutateStudentSchema.safeParse(body)

        if (!parse.success) {
            const errorMessages = parse.error.issues.map((err) => err.message)

            // Validate and handle file upload errors
            if (req?.file?.path && fs.existsSync(req?.file?.path)) {
                fs.unlinkSync(req?.file?.path);
            }

            return res.status(500).json({
                message: 'Error Validation',
                data: null,
                errors: errorMessages,
            });
        }

        const hashPassword = bcrypt.hashSync(req.body.password, 12);

        // Create a new student model instance
        const student = new userModel({
            name: req.body.name,
            email: req.body.email,
            password: hashPassword,
            photo: req.file?.filename,
            manager: req.user?._id,
            role: 'student'
        });

        // Save the student to the database
        await student.save();

        return res.json({
            message: 'Create student success',
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
        });
    }
};


