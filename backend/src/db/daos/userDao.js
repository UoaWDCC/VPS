import User from "../models/user";
import Scenario from "../models/scenario";

const retrieveAllUser = async () => {
  return User.find();
};

const retrieveUser = async (uid) => {
  const user = await User.find({ uid: uid });
  return user;
};

const createUser = async (name, uid, email, pictureURL) => {
  const user = await User.find({ uid: uid });
  if (user.length === 0) {
    const dbUser = new User({
      name,
      uid,
      email,
      pictureURL,
    });
    await dbUser.save();
    return dbUser;
  }
  return user;
};

const deleteUser = async (uid) => {
  try {
    const user = await User.find({ uid: uid });
    await user.remove();
    return true;
  } catch (e) {
    return false;
  }
};

const addPlayed = async (uid, newPlayed, scenarioId) => {
  try {
    await User.updateOne({ uid: uid }, { $push: { played: newPlayed } });
    await Scenario.updateOne({ _id: scenarioId }, { $push: { users: uid } });
    return true;
  } catch (e) {
    return false;
  }
};

export { retrieveAllUser, createUser, retrieveUser, deleteUser, addPlayed };
