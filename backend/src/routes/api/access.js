import { Router } from "express";
import { getAccessList } from "../../db/daos/accessDao.js";

const router = Router();

router.get("/", async(req, res) => {
    // res.json("test")
    return res.json("Access route");
})

router.get("/dashboard/:scenarioId", async (req, res) => {
    try {
        const {scenarioId} = req.params;
        const list = await getAccessList(scenarioId);
        return res.status(200).json(list);
    } catch(error) {
        return res.status(404).json({error: error.message});
    }

})

export default router;