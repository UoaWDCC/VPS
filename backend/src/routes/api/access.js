import { Router } from "express";
import { getAccessibleScenarios, createAccessList, deleteAccessList, getAccessList, grantAccess, revokeAccess } from "../../db/daos/accessDao.js";
import auth from "../../middleware/firebaseAuth.js";
import { retrieveAccessibleScenarios, retrieveScenario } from "../../db/daos/scenarioDao.js";
const router = Router();

router.use(auth);

// Returns the scenarios the user has view access to dashboard
router.get("/", async(req, res) => {
    // res.json("test")
    const uid = req.body.uid;
    const accessible = await retrieveAccessibleScenarios(uid);
  
    return res.status(200).json(accessible);
})

router.get("/:scenarioId/users", async (req, res) => {
    try {
        const {scenarioId} = req.params;
        const list = await getAccessList(scenarioId);
        if(!list) return res.status(200).json({status: 404, error: "Not found"});
        return res.status(200).json(list);
    } catch(err) {
        return res.status(500).json({error: err.message});
    }

})

router.put("/:scenarioId/users/:userId", async(req, res) => {
    try{
        const {scenarioId, userId} = req.params;

        // Most likely won't happen as it's pulling form a list of table but still better to check.
        if(!userId) return res.status(400).json({error: "UserId required"});

        const updated = await grantAccess(scenarioId, userId);
        if(!updated) return res.status(404).json({error: "Access list not found"});

        return res.status(200).json(updated);
    } catch(err) {
        return res.status(500).json({error: err.message});
    }
})

/**
 * Need to protect the routes below to ensure that only the author can make changes, either this or later need to add permissions such that the    owner can give out permission to add/remove/view/etc 
 */
router.post("/:scenarioId/create", async(req, res) => {
    try {
        const {scenarioId} = req.params;
        const uid = req.body.uid;
   
        if(!uid) return res.status(401).json("NO ID UNAUTH");
        
        const scenario = await retrieveScenario(scenarioId).catch(() => null);
     
        if(!scenario) return res.status(404).json({error: "Scenario not found"});

        if(scenario.uid != uid) return res.status(403);

        const name = scenario?.name || "Default name";

        const created = await createAccessList(scenarioId, name, scenario.uid);
        if(!created) return res.status(500).json({error:"Failed creating access list"});

        return res.status(201).json(created);
    } catch(err){
        res.status(500).json({error: "Internal server error"})
        return;
    }
})

router.delete("/:scenarioId/users/:userId", async(req, res) => {
    try{
        const {scenarioId, userId} = req.params;
        // console.log(req.params)
        // Result = true - deleted
        // Result = false - not found/failed
        const result = await revokeAccess(scenarioId, userId);
        if(result?.status == 403) return res.status(result.status).json({error: result.message});
        // console.log(result)
        if(result?.status == 304) return res.status(304).json({error: "Access list or user not found"});
        
        return res.status(200).json(result);
    } catch(err) {
        return res.status(500).json({error: err.message});
    }
})

router.delete("/:scenarioId", async(req, res) => {
    try{
        const {scenarioId} = req.params;
        const uid = req.body.uid;
        const result = await deleteAccessList(scenarioId, uid)

        return res.status(200).json(result);
    } catch(err) {
        return res.status(500).json({error: err.message});
    }
})

export default router;