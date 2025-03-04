import courseModel from '../models/courseModel.js';
import cloudinary from '../utils/cloudinary.js';
import fs from 'fs';
import categoryModel from '../models/categoryModel.js';
import userModel from '../models/userModel.js';
import { mutateCourseSchema } from '../utils/schema.js';
import path from 'path';
import courseDetailModel from '../models/courseDetailModel.js';

export const getCourses = async (req, res) => {
    try {
        const courses = await courseModel.find({ manager: req.user?._id })
            .select('name thumbnail')
            .populate({ path: 'category', select: 'name _id' })
            .populate({ path: 'students', select: 'name' });

        const response = courses.map((item) => ({
            ...item.toObject(),
            thumbnail_url: item.thumbnail, // Cloudinary URL langsung
            total_students: item.students.length
        }));

        return res.json({ message: 'Get Courses Success', data: response });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


export const getCategories = async (req, res) => {
    try {
        const categories = await categoryModel.find();

        return res.json({
            message: 'Get categories success',
            data: categories,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
        });
    }
};

export const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        const { preview } = req.query;

        const course = await courseModel
            .findById(id)
            .populate({
                path: 'category',
                select: 'name -_id'
            })
            .populate({
                path: 'details',
                select: preview === "true" ? 'title type youtubeId text' : 'title type'
            });

        if (!course) {
            return res.status(404).json({
                message: 'Course not found',
            });
        }

        return res.json({
            message: 'Get Course Detail success',
            data: {
                ...course.toObject(),
                thumbnail_url: course.thumbnail // URL langsung dari Cloudinary
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
        });
    }
};


export const postCourse = async (req, res) => {
    try {
        const body = req.body;

        // Validasi input
        const parse = mutateCourseSchema.safeParse(body);
        if (!parse.success) {
            return res.status(400).json({
                message: 'Error Validation',
                errors: parse.error.issues.map((err) => err.message),
            });
        }

        // Cek apakah kategori ada
        const category = await categoryModel.findById(parse.data.categoryId);
        if (!category) {
            return res.status(400).json({
                message: 'Category Id not found',
            });
        }

        // Pastikan file ada sebelum mengaksesnya
        if (!req.file || !req.file.path) {
            return res.status(400).json({ message: 'Thumbnail image is required' });
        }

        // Buat course baru dengan URL Cloudinary
        const course = new courseModel({
            name: parse.data.name,
            category: category._id,
            description: parse.data.description,
            tagline: parse.data.tagline,
            thumbnail: req.file.path, // Simpan URL Cloudinary ke database
            manager: req.user._id,
        });

        await course.save();

        // Update kategori dan user
        await categoryModel.findByIdAndUpdate(category._id, { $push: { courses: course._id } });
        await userModel.findByIdAndUpdate(req.user._id, { $push: { courses: course._id } });

        return res.status(201).json({
            success: true,
            message: "Create Course Success",
            course
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};




export const updateCourse = async (req, res) => {
    try {
        const body = req.body;
        const courseId = req.params.id;

        console.log(req.file);

        // Parse and validate the request body using the schema
        const parse = mutateCourseSchema.safeParse(body);

        if (!parse.success) {
            return res.status(400).json({
                message: 'Validation Error',
                errors: parse.error.issues.map((err) => err.message),
            });
        }

        // Cek apakah kategori ada
        const category = await categoryModel.findById(parse.data.categoryId);
        const oldCourse = await courseModel.findById(courseId);
        if (!category) {
            return res.status(400).json({ message: 'Category Id not found' });
        }

        let updatedThumbnail = oldCourse.thumbnail; // Gunakan gambar lama jika tidak ada file baru

        if (req.file) {
            // Hapus gambar lama dari Cloudinary jika ada
            if (oldCourse.thumbnail) {
                const publicId = oldCourse.thumbnail.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`uploads/${publicId}`);
            }

            // Simpan URL Cloudinary yang baru
            updatedThumbnail = req.file.path;
        }

        await courseModel.findByIdAndUpdate(
            courseId,
            {
                name: parse.data.name,
                category: category._id,
                description: parse.data.description,
                tagline: parse.data.tagline,
                thumbnail: updatedThumbnail, // Simpan URL Cloudinary baru atau gunakan yang lama
                manager: req.user._id,
            }
        );

        return res.json({ message: 'Update Course Success' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        // Cari course berdasarkan ID
        const course = await courseModel.findById(id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Hapus thumbnail dari Cloudinary jika ada
        if (course.thumbnail) {
            const publicId = course.thumbnail.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`courses/${publicId}`);
        }

        // Hapus course dari database
        await courseModel.findByIdAndDelete(id);

        return res.json({ message: 'Delete course success' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const postContentCourse = async (req, res) => {
    try {
        const body = req.body;

        // Find the course by ID
        const course = await courseModel.findById(body.courseId);

        // Create a new course detail (content)
        const content = new courseDetailModel({
            title: body.title,
            type: body.type,
            course: course._id,
            text: body.text,
            youtubeId: body.youtubeId,
        });

        await content.save();

        // Update the course model with the new content details
        await courseModel.findByIdAndUpdate(course._id, {
            $push: {
                details: content._id,
            },
        }, { new: true });

        return res.json({
            message: 'Create Content Success',
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
        });
    }
};

export const updateContentCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;

        // Find the related course by courseId from the request body
        const course = await courseModel.findById(body.courseId);
        if (!course) {
            return res.status(404).json({
                message: 'Course not found',
            });
        }

        // Update the course detail content using the provided ID
        await courseDetailModel.findByIdAndUpdate(id, {
            title: body.title,
            type: body.type,
            course: course._id,
            text: body.text,
            youtubeId: body.youtubeId,
        }, { new: true });

        return res.json({
            message: 'Update Content Success',
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
        });
    }
};

export const deleteContentCourse = async (req, res) => {
    try {
        const { id } = req.params

        await courseDetailModel.findByIdAndDelete(id)

        return res.json({
            message: 'Delete Content Success'
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
        });

    }
}
export const getDetailContent = async (req, res) => {
    try {
        const { id } = req.params;

        const content = await courseDetailModel.findById(id);
        if (!content) {
            return res.status(404).json({
                message: 'Content not found',
            });
        }

        return res.json({
            message: 'Get Detail Content success',
            data: content,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
        });
    }
};

export const getStudentsByCourseId = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await courseModel
            .findById(id)
            .select('name')
            .populate({
                path: 'students',
                select: 'name email photo',
            });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const studentsMap = course?.students?.map((item) => ({
            ...item.toObject(),
            photo_url: item.photo, // Sudah berupa URL dari Cloudinary
        }));

        return res.json({
            message: 'Get students by course success',
            data: {
                ...course.toObject(),
                students: studentsMap,
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


export const postStudentToCourse = async (req, res) => {
    try {
        const { id } = req.params; // Course ID
        const body = req.body; // Request body containing studentId

        // Update the user (student) document to include this course
        await userModel.findByIdAndUpdate(body.studentId, {
            $push: {
                courses: id,
            },
        });

        // Update the course document to include this student
        await courseModel.findByIdAndUpdate(id, {
            $push: {
                students: body.studentId,
            },
        });

        return res.json({
            message: 'Add Student to course success!',
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
        });
    }
};

export const deleteStudentToCourse = async (req, res) => {
    try {
        const { id } = req.params; // Course ID
        const body = req.body; // Request body containing studentId

        // Update the user (student) document to include this course
        await userModel.findByIdAndUpdate(body.studentId, {
            $pull: {
                courses: id,
            },
        });

        // Update the course document to include this student
        await courseModel.findByIdAndUpdate(id, {
            $pull: {
                students: body.studentId,
            },
        });

        return res.json({
            message: 'Delete Student to course success!',
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
        });
    }
};
