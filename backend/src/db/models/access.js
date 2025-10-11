import mongoose from "mongoose"

const { Schema} = mongoose;

const accessSchema = new Schema({
    scenarioId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    ownerId: {
        type: String,
        required: true,
    },
    users:[
        {
            type: String,
        }
    ],
    
},{timestamps: true},)

const Access = mongoose.model("Access", accessSchema, "access");

export default Access;