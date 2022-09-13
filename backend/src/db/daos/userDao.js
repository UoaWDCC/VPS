import User from "../models/user";

const retrieveDashboardInfo = async ()=>{
    return User.find();

}


const createUser = async (name, uid, email) => {
    const dbUser = new User({
      name,
      uid,
      email,
    });
    await dbUser.save();
  
    return dbUser;
  };

export {retrieveDashboardInfo, createUser};