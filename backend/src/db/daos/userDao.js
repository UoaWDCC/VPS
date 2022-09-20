import User from "../models/user";
import Scenario from "../models/scenario";

const retrieveAllUser = async () => {
  return User.find();
};

const retrieveUser = async (userId) => {
  const user = await User.findById(userId);
  return user;
};

const createUser = async (name, uid, email,pictureURL) => {
  const dbUser = new User({
    name,
    uid,
    email,
    pictureURL,
  });
  await dbUser.save();

  return dbUser;
};

const deleteUser = async (userId) => {
  try {
    const user = await User.findById(userId);
    await user.remove();
    return true;
  } catch (e) {
    return false;
  }
};

const addPlayed = async (userId, newPlayed, scenarioId) => {
    try{
      await User.updateOne({_id: userId},{$push: {played: newPlayed}});
      await Scenario.updateOne({ _id: scenarioId}, {$push: {users: userId}});
      return true;
    } catch(e){
      return false;
    }
    
  };

export { retrieveAllUser, createUser, retrieveUser, deleteUser, addPlayed };
