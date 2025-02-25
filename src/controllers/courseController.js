import courseModel from '../models/courseModel.js';
import fs from 'fs';
import categoryModel from '../models/categoryModel.js';
import userModel from '../models/userModel.js';
import { mutateCourseSchema } from '../utils/schema.js';
import path from 'path';

export const getCourses = async (req, res) => {
    try {
        const courses = await courseModel.find({
            manager: req.user?._id,
        })
            .select('name thumbnail')
            .populate({
                path: 'category',
                select: 'name _id',
            })
            .populate({
                path: 'students',
                select: 'name',
            });

        const imageUrl = process.env.APP_URL + '/uploads/courses/'

        const response = courses.map((item) => {
            return {
                ...item.toObject(),
                thumbnail_url: imageUrl + item.thumbnail,
                total_students: item.students.length
            }
        })

        return res.json({
            message: 'Get Courses Success',
            data: response,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
        });
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


export const postCourse = async (req, res) => {
    try {
        const body = req.body;

        console.log(req.file);

        // Parse and validate the request body using the schema
        const parse = mutateCourseSchema.safeParse(body);

        // Handle validation errors
        if (!parse.success) {
            const errorMessages = parse.error.issues.map((err) => err.message);

            // Remove the uploaded file if validation fails
            if (req?.file?.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            return res.status(500).json({
                message: 'Error Validation',
                data: null,
                errors: errorMessages,
            });
        }

        // Check if the category exists in the database
        const category = await categoryModel.findById(parse.data.categoryId);
        if (!category) {
            return res.status(500).json({
                message: 'Category Id not found',
            });
        }

        // Create a new course instance
        const course = new courseModel({
            name: parse.data.name,
            category: category._id,
            description: parse.data.description,
            tagline: parse.data.tagline,
            thumbnail: req.file?.filename,
            manager: req.user._id,
        });

        // Save the course to the database
        await course.save();

        // Update the category model with the new course
        await categoryModel.findByIdAndUpdate(category._id, {
            $push: {
                courses: course._id,
            },
        }, { new: true });

        // Update the user model with the new course
        await userModel.findByIdAndUpdate(req.user?._id, {
            $push: {
                courses: course._id,
            },
        }, { new: true });

        return res.json({
            message: 'Create Course Success',
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
        });
    }
};

export const updateCourse = async (req, res) => {
    try {
        const body = req.body;
        const courseId = req.params.id;


        console.log(req.file);

        // Parse and validate the request body using the schema
        const parse = mutateCourseSchema.safeParse(body);

        // Handle validation errors
        if (!parse.success) {
            const errorMessages = parse.error.issues.map((err) => err.message);

            // Remove the uploaded file if validation fails
            if (req?.file?.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            return res.status(500).json({
                message: 'Error Validation',
                data: null,
                errors: errorMessages,
            });
        }

        // Check if the category exists in the database
        const category = await categoryModel.findById(parse.data.categoryId);
        const oldCourse = await courseModel.findById(courseId)
        if (!category) {
            return res.status(500).json({
                message: 'Category Id not found',
            });
        }

        await courseModel.findByIdAndUpdate(
            courseId,
            {
                name: parse.data.name,
                category: category._id,
                description: parse.data.description,
                tagline: parse.data.tagline,
                thumbnail: req?.file ? req.file?.filename : oldCourse.thumbnail,
                manager: req.user._id,
            }
        );



        return res.json({
            message: 'Update Course Success',
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
        });
    }
};

export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        // Find the course by ID
        const course = await courseModel.findById(id);

        const dirname = path.resolve()



        // Construct the file path for the course thumbnail
        const filePath = path.join(
            dirname, 'public/uploads/courses', course.thumbnail
        );

        // Delete the thumbnail file if it exists
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete the course from the database
        await courseModel.findByIdAndDelete(id);

        return res.json({
            message: 'Delete course success',
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
        });
    }
};
