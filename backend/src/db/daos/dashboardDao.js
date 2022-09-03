import Dashboard from "../models/dashboard";

const retrieveDashboardInfo = async ()=>{
    return Dashboard.find();

}

export {retrieveDashboardInfo};