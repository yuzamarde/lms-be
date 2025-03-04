import userModel from "../models/userModel.js"
import cloudinary from '../utils/cloudinary.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import { mutateStudentSchema } from "../utils/schema.js";
import courseModel from "../models/courseModel.js";
import path from "path";

export const getStudents = async (req, res) => {
    try {
        const students = await userModel.find({
            role: 'student',
            manager: req.user._id
        }).select('name courses photo');

        // Transformasi data students agar menggunakan Cloudinary URL
        const response = students.map((item) => ({
            ...item.toObject(),
            photo_url: item.photo, // URL langsung dari Cloudinary
        }));

        return res.json({
            message: 'Get Student success',
            data: response
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await userModel.findById(id).select('name email');

        if (!student) {
            return res.status(404).json({
                message: 'Student not found',
            });
        }

        return res.json({
            message: 'Get detail student success',
            data: student,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
        });
    }
};


export const postStudent = async (req, res) => {
    try {
        const body = req.body;
        const parse = mutateStudentSchema.safeParse(body);

        if (!parse.success) {
            const errorMessages = parse.error.issues.map((err) => err.message);
            return res.status(400).json({
                message: 'Error Validation',
                errors: errorMessages,
            });
        }

        const hashPassword = bcrypt.hashSync(req.body.password, 12);
        let photoUrl = null;

        // Upload ke Cloudinary jika ada file
        if (req.file) {
            const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                folder: "students",
            });
            photoUrl = uploadResult.secure_url; // Simpan URL Cloudinary
        }

        // Create student
        const student = new userModel({
            name: req.body.name,
            email: req.body.email,
            password: hashPassword,
            photo: photoUrl,
            manager: req.user?._id,
            role: 'student'
        });

        await student.save();

        return res.json({
            message: 'Create student success',
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;
        const parse = mutateStudentSchema.partial({ password: true }).safeParse(body);

        if (!parse.success) {
            const errorMessages = parse.error.issues.map((err) => err.message);
            return res.status(400).json({
                message: 'Error Validation',
                errors: errorMessages,
            });
        }

        const student = await userModel.findById(id);
        if (!student) return res.status(404).json({ message: "Student not found" });

        let updatedPhoto = student.photo;
        if (req.file) {
            // Hapus foto lama dari Cloudinary jika ada
            if (student.photo) {
                const publicId = student.photo.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`students/${publicId}`);
            }

            // Upload foto baru ke Cloudinary
            const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                folder: "students",
            });
            updatedPhoto = uploadResult.secure_url;
        }

        const hashPassword = parse.data?.password
            ? bcrypt.hashSync(parse.data.password, 12)
            : student.password;

        await userModel.findByIdAndUpdate(id, {
            name: parse.data.name,
            email: parse.data.email,
            password: hashPassword,
            photo: updatedPhoto,
        });

        return res.json({ message: 'Update student success' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await userModel.findById(id);
        if (!student) return res.status(404).json({ message: "Student not found" });

        await courseModel.findOneAndUpdate(
            { students: id },
            { $pull: { students: id } }
        );

        // Hapus avatar dari Cloudinary jika ada
        if (student.photo) {
            const publicId = student.photo.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`students/${publicId}`);
        }

        await userModel.findByIdAndDelete(id);

        return res.json({ message: 'Delete student success' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


export const getCoursesStudent = async (req, res) => {
    try {
        const user = await userModel.findById(req.user._id).populate({
            path: "courses",
            select: "name category thumbnail",
            populate: { path: 'category', select: 'name' }
        });

        const response = user?.courses?.map((item) => ({
            ...item.toObject(),
            thumbnail_url: item.thumbnail, // URL Cloudinary langsung
        }));

        return res.json({
            message: "Get Courses success",
            data: response,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

