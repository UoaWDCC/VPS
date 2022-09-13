import User from "../models/user";

const retrieveAllUser = async ()=>{
    return User.find();

}

const retrieveUser = async (userId) => {
    const user = await User.findById(userId);
    return user;
  };


const createUser = async (name, uid, email) => {
    const dbUser = new User({
      name,
      uid,
      email,
    });
    await dbUser.save();
  
    return dbUser;
  };

export {retrieveAllUser, createUser, retrieveUser};