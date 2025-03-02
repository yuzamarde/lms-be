import courseModel from '../models/courseModel.js';
import userModel from '../models/userModel.js';

export const getOverviews = async (req, res) => {
    try {
        const totalCourses = await courseModel
            .find({ manager: req.user._id })
            .countDocuments();

        const courses = await courseModel.find({
            manager: req.user._id
        })

        const totalStudents = courses.reduce(
            (acc, curr) => acc + curr.students.length,
            0
        )

        const coursesVideos = await courseModel.find({
            manager: req.user._id
        }).populate({
            path: 'details',
            select: 'name type',
            match: {
                type: 'video'
            }
        })

        const totalVideos = coursesVideos.reduce(
            (acc, curr) => acc + curr.details.length,
            0
        )

        const coursesTexts = await courseModel.find({
            manager: req.user._id
        }).populate({
            path: 'details',
            select: 'name type',
            match: {
                type: 'text'
            }
        })

        const totalTexts = coursesTexts.reduce(
            (acc, curr) => acc + curr.details.length,
            0
        )

        const coursesList = await courseModel.find({
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

        const students = await userModel.find({
            role: 'student',
            manager: req.user._id
        }).select('name courses photo');

        const photoUrl = process.env.APP_URL + '/uploads/students/'

        const responseStudents = students.map((item) => {
            return {
                ...item.toObject(),
                photo_url: photoUrl + item.photo
            }
        })


        const responseCourses = coursesList.map((item) => {
            return {
                ...item.toObject(),
                thumbnail_url: imageUrl + item.thumbnail,
                total_students: item.students.length
            }
        })


        return res.json({
            message: 'Get overview success',
            data: {
                totalCourses,
                totalStudents,
                totalVideos,
                totalTexts,
                courses: responseCourses,
                students: responseStudents,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal server error',
        });
    }
};
