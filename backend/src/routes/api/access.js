import { Router } from "express";
import { getAccessList, grantAccess, revokeAccess } from "../../db/daos/accessDao.js";
import auth from "../../middleware/firebaseAuth.js";
const router = Router();

// router.use(auth);

router.get("/", async(req, res) => {
    // res.json("test")
    return res.json("Access route");
})

router.get("/:scenarioId/users", async (req, res) => {
    try {
        const {scenarioId} = req.params;
        const list = await getAccessList(scenarioId);
        if(!list) return res.status(404).json({error: "Not found"});
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
router.delete("/:scenarioId/users/:userId", async(req, res) => {
    try{
        const {scenarioId, userId} = req.params;
        const result = await revokeAccess(scenarioId, userId);
        if(result?.status == 403) return res.status(result.status).json({error: result.message});

        if(!result) return res.status(404).json({error: "Access list or user not found"});
        
        return res.status(200).json(result);
    } catch(err) {
        return res.status(500).json({error: err.message});
    }
})

export default router;