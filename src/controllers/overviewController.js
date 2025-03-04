import courseModel from '../models/courseModel.js';
import userModel from '../models/userModel.js';

export const getOverviews = async (req, res) => {
    try {
        // Hitung total courses yang dimiliki oleh manager
        const totalCourses = await courseModel.countDocuments({ manager: req.user._id });

        // Ambil semua course milik manager
        const courses = await courseModel.find({ manager: req.user._id });

        // Hitung total students di semua course
        const totalStudents = courses.reduce((acc, curr) => acc + curr.students.length, 0);

        // Hitung jumlah videos di dalam courses
        const coursesVideos = await courseModel.find({ manager: req.user._id })
            .populate({
                path: 'details',
                select: 'name type',
                match: { type: 'video' }
            });

        const totalVideos = coursesVideos.reduce((acc, curr) => acc + (curr.details?.length || 0), 0);

        // Hitung jumlah texts di dalam courses
        const coursesTexts = await courseModel.find({ manager: req.user._id })
            .populate({
                path: 'details',
                select: 'name type',
                match: { type: 'text' }
            });

        const totalTexts = coursesTexts.reduce((acc, curr) => acc + (curr.details?.length || 0), 0);

        // Ambil daftar courses beserta kategori dan students
        const coursesList = await courseModel.find({ manager: req.user?._id })
            .select('name thumbnail')
            .populate({
                path: 'category',
                select: 'name _id',
            })
            .populate({
                path: 'students',
                select: 'name',
            });

        // Ambil daftar students yang memiliki manager terkait
        const students = await userModel.find({ role: 'student', manager: req.user._id })
            .select('name courses photo');

        // Transformasi data courses agar menggunakan URL Cloudinary
        const responseCourses = coursesList.map((item) => ({
            ...item.toObject(),
            thumbnail_url: item.thumbnail, // Thumbnail langsung dari Cloudinary
            total_students: item.students.length
        }));

        // Transformasi data students agar menggunakan URL Cloudinary
        const responseStudents = students.map((item) => ({
            ...item.toObject(),
            photo_url: item.photo, // URL langsung dari Cloudinary
        }));

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
        return res.status(500).json({ message: 'Internal server error' });
    }
};

