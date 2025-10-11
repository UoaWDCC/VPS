import Access from "../models/access.js";

/**
 * 
 * @param {string} scenarioId 
 * @returns the access list of the given scenarioId
 */
const getAccessList = async(scenarioId) => {
    try{
        const list = await Access.findOne({scnarioId: scenarioId});
        console.log(list)
        if(!list) {
            throw new Error("list not found")
        }
        return list;
    } catch(error){
        throw new Error(`Error retreiving access list: ${error.message}` )
    }
}

/**
 * 
 * @param {string} scenarioId 
 * @param {string} name
 * @param {string} userId 
 * @returns created database access object 
 */
const createAccessList = async(scenarioId, name, userId) => {
    const dbAccess = new Access({
        scenarioId: scenarioId,
        name: name,
        ownerId: userId,
        users: userId,
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
    try {
        const accessList = await Access.findOneAndUpdate(
            {scenarioId: scenarioId},
            {$addToSet: {userId}},
            {new: true}
        );
        if(!accessList) {
            throw new Error("list not found.");
        }
        return accessList;
    } catch(error) {
        throw new Error(`Error granting user access: ${error.message}`);
    }
}

/**
 * 
 * @param {string} scenarioId 
 * @param {String} userId 
 * @returns 
 */
const revokeAccess = async(scenarioId, userId) => {
    const res = await Access.findOneAndUpdate(
        {scenarioId: scenarioId},
        {$pull: {users: userId}}
    )
    return res;
}

export {
    getAccessList,
    createAccessList,
    deleteAccessList,
    grantAccess,
    revokeAccess
}