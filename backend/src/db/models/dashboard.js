import mongoose from "mongoose";

const { Schema } = mongoose;

const dashboardSchema = new Schema({
    test_data: string
});

const Dashboard = mongoose.model("Dashboard", dashboardSchema);

export default Dashboard;
