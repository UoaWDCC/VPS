import Access from "../models/access.js";
import User from "../models/user.js";
import { retrieveUser } from "./userDao.js";

/**
 * 
 * @param {string} scenarioId 
 * @returns the access list of the given scenarioId
 */
const getAccessList = async(scenarioId) => {
    if(!scenarioId) return null;
    const list = await Access.findOne({scenarioId: scenarioId});
    return list;
}

/**
 * 
 * @param {string} scenarioId 
 * @param {string} name scenario name
 * @param {string} userId 
 * @returns created database access object 
 */
const createAccessList = async(scenarioId, name, userId) => {
    // Will need better checking and synergy with the creation to ensure that a scenario isnt created if an access list isn't created.
    const uInfo = await User.findOne({uid: userId}).select("name email -_id");
    if(!uInfo) return null;
    const dbAccess = new Access({
        scenarioId: scenarioId,
        name: name,
        ownerId: userId,
        users: {[userId] : {name:uInfo.name, email: uInfo.email, date: new Date() }},
    });
    await dbAccess.save();
    return dbAccess;

}

const deleteAccessList = async(scenarioId, ownerId) => {
    try {
        const res = await Access.findOneAndDelete(
            {scenarioId: scenarioId, ownerId: ownerId}
        )
        if(res){
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

/**
 * 
 * @param {string} scenarioId 
 * @param {string} userId 
 * @returns updated access list 
 */
const grantAccess = async(scenarioId, userId) => {
   if(!scenarioId || !userId) return null;
    const uInfo = await User.findOne({uid: userId}).select("name email -_id");
    if(!uInfo) return null;
    const updateObj ={[`users.${userId}`]: {name: uInfo.name, email: uInfo.email, date: new Date()}};
    console.log(updateObj)
    const updatedList = await Access.findOneAndUpdate(
        {scenarioId: scenarioId},
        {$set: updateObj},
        {new: true}
    );
    console.log(updatedList)

    return updatedList;
    
}

/**
 * 
 * @param {string} scenarioId 
 * @param {String} userId 
 * @returns 
 */
const revokeAccess = async(scenarioId, userId) => {
    if(!scenarioId || !userId) return false;

    const doc = await Access.findOne({scenarioId}).select("ownerId").lean();
    const isOwner = doc?.ownerId == userId;
    
    if(isOwner) return {status: 403, message: "Protected"};
 
    const updated = await Access.findOneAndUpdate(
        {scenarioId: scenarioId},
        {$unset: {[`users.${userId+1}`]:""}},
    )
    console.log(updated.users)
    
    const stillContains = updated.users && updated.users.has(userId+1);
    console.log("Still contains the user: " + stillContains);
    return false;
}

export {
    getAccessList,
    createAccessList,
    deleteAccessList,
    grantAccess,
    revokeAccess
}