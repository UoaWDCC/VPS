import { getAccessList } from "../db/daos/accessDao.js";
import { getGroup } from "../db/daos/groupDao.js";

const HTTP_UNAUTHORISED = 401;
const HTTP_NOT_FOUND = 404;

export default async function dashboardAuth(req, res, next) {
    try{
        let sId = req.params?.scenarioId;
        // If no sID meaning the group is being requested, pull it from the group instead
        if(!sId){
            const group = await getGroup(req.params.groupId)
            sId = group.scenarioId;
        }
        const accessList = await getAccessList(sId);
        if(accessList) {
            if(accessList.users.includes(req.body.uid))
            {
                next();
            } else {
                console.log("Middleware unauthorized")
                res.sendStatus(HTTP_UNAUTHORISED);
            }
        }
    } catch(err){
        console.log("Middleware list not found")
        res.sendStatus(HTTP_NOT_FOUND);
    }
}