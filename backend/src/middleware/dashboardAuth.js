import { getAccessList } from "../db/daos/accessDao.js";
import { getGroup } from "../db/daos/groupDao.js";
import { retrieveScenario } from "../db/daos/scenarioDao.js";

const HTTP_UNAUTHORISED = 401;
const HTTP_NOT_FOUND = 404;

export default async function dashboardAuth(req, res, next) {
    try{
        let sId = req.params?.scenarioId || null;
        // No sId could mean group so get it from group
        if(!sId){
            const group = await getGroup(req.params.groupId).catch(() => null)
            sId = group.scenarioId;
        }

        // If still doesnt exists return the user with 404
        if(!sId) {
            return res.sendStatus(HTTP_NOT_FOUND);
        }

        const accessList = await getAccessList(sId).catch(() => null);
        const scenario = await retrieveScenario(sId).catch(() => null);

        // If neither exists return 404
        if(!accessList && !scenario) {
            res.sendStatus(HTTP_NOT_FOUND);
            return;
        }
        let isOnList = false;
        let isOwner = false;
        if(accessList) {
            isOnList = (accessList?.users).includes(req.body.uid);
        } else {
            isOwner = scenario?.uid == req.body.uid;
        }

        if(isOnList || isOwner){
            next();
            return;
        } 

        // If it reaches the end just unauthorize
        return res.sendStatus(HTTP_UNAUTHORISED)
        
    } catch(err) {


            res.status(500).json({error: "Internal server error"})
return 
    }

}