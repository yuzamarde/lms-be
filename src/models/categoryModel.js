import mongoose from 'mongoose';

const categoryModel = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    courses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }
    ]
}, {
    timestamps: true,
}
);

export default mongoose.model('Category', categoryModel);
