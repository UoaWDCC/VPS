import mongoose from "mongoose";

const { Schema } = mongoose;

const dashboardSchema = new Schema({
    test_data: String
});

const Dashboard = mongoose.model("model", dashboardSchema, "dashboard");

export default Dashboard;
