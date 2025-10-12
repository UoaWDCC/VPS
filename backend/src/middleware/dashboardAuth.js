import { getAccessList } from "../db/daos/accessDao.js";

const HTTP_UNAUTHORISED = 401;
const HTTP_NOT_FOUND = 404;

export default async function dashboardAuth(req, res, next) {
    console.log(req.params.scenarioId)
    // console.log(req.body?.uid);
    const accessList = await getAccessList(req.params.scenarioId);
    // console.log(accessList)
    if(accessList) {
        if(accessList.users.includes(req.body.uid))
        {
            console.log("Has access")
            next();
        } else {
            res.sendStatus(HTTP_UNAUTHORISED);
        }
    } else{
        console.log("No access")
        res.sendStatus(HTTP_NOT_FOUND);
    }
}