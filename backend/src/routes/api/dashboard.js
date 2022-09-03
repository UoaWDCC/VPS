import { Router } from "express";
import { retrieveDashboardInfo } from "../../db/daos/dashboardDao";

const router = Router();

router.get("/"), async(req,res)=>{
  console.log("tyo")
  // const dashboard = await retrieveDashboardInfo();
  // res.json(dashboard);
}
export default router;