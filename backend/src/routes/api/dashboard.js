import { Router } from "express";
import { retrieveDashboardInfo } from "../../db/daos/dashboardDao";

const router = Router();

router.get("/", async(req,res)=>{
  const dashboard = await retrieveDashboardInfo();
  console.log(dashboard)
  res.json(dashboard);
});
export default router;