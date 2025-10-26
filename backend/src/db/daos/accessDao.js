import Access from "../models/access.js";
import User from "../models/user.js";


const getAccessibleScenarios = async(uid) => {
    if(!uid) return null;
    const accessDocs = await Access.find({
        $or: [{ownerId: uid}, {[`users.${uid}`]: {$exists: true}}],
    }).sort({_id: 1}).lean();


    // return addThumbs(accessible);
}

/**
 * 
 * @param {string} scenarioId 
 * @returns the access list of the given scenarioId ordered
 */
const getAccessList = async(scenarioId) => {
    if(!scenarioId) return null;
    const list = await Access.findOne({scenarioId: scenarioId}).sort({name: -1});
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
        console.log(res);
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

    const updatedList = await Access.findOneAndUpdate(
        {scenarioId: scenarioId},
        {$set: updateObj},
        {new: true}
    );
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
        {$unset: {[`users.${userId}`]:""}},
        {new: true}
    )
    const stillContains = updated.users.has(userId);

    if(stillContains) return {status: 304, message:"No found or removed"};
    
    return {status:200, message: "Revoked"};
}

export {
    getAccessibleScenarios,
    getAccessList,
    createAccessList,
    deleteAccessList,
    grantAccess,
    revokeAccess
}