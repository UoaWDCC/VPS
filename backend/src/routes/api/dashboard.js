import { Router } from "express";
import { retrieveScenario } from "../../db/daos/scenarioDao.js";
import { retrieveSceneList, retrieveScene } from "../../db/daos/sceneDao.js";
import { getGroup, getGroupByScenarioId } from "../../db/daos/groupDao.js";
import auth from "../../middleware/firebaseAuth.js";
import dashboardAuth from "../../middleware/dashboardAuth.js";

const router = Router();

// Firebase  & dashbaord atuh
router.use(auth);

router.get("/", async(req, res) =>{
    console.log(req.body)
    return res.status(200).json({ok: true})
})
router.use("/scenarios/:scenarioId", dashboardAuth);
router.use("/groups/:groupId", dashboardAuth)
router.use("/access", dashboardAuth);

router.get("/scenarios/:scenarioId/access", async (req, res) => {
    return res.status(200).json({allowed: true})
})

/**
 * Get a specific scenario by ID
 * Old URI: /scenario/:scenarioId
 * New URI: /scenarios/:scenarioId
 */
router.get("/scenarios/:scenarioId", async (req, res) => {
    const scenario = await retrieveScenario(req.params.scenarioId)
    return res.status(200).json(scenario);
})

// Get all the scenes for a given scenario
/**
 * Get all the scenes for a given scenario
 * Old URI: /scenario/:scenarioId/scene/all
 * New URI: /scenarios/:scenarioId/scenes
 */
router.get("/scenarios/:scenarioId/scenes", async (req, res) =>{
    try{
        const scenes = await retrieveSceneList(req.params.scenarioId);
        const fullScenes = await Promise.all(scenes.map((it)=>retrieveScene(it._id)));
        return res.status(200).json(fullScenes)
    } catch(err){
        return res.status(404).json({error: err.message})
    }
})

/**
 * Get a list of groups for a given scenario
 * Old URI: /group/scenario/:scenarioId
 * New URI: /scenarios/:scenarioId/groups
 */
router.get("/scenarios/:scenarioId/groups", async (req, res) => {
    try {
        const {scenarioId} = req.params;
        const groups = await getGroupByScenarioId(scenarioId);
        return res.status(200).json(groups);
    } catch(err){
        return res.status(404).json({error: err.message});
    }
})

/**
 * Retrieve a specific group to view 
 * Old URI: /group/retrieve/:groupId
 * new URI: /groups/:groupId
 */
router.get("/groups/:groupId", async (req, res)=>{
    const {groupId} = req.params;
    const group = await getGroup(groupId);
    if(!group) {
        return res.status(404).json({error:"Group not found"});
    }
    return res.status(200).json(group);
})


export default router;