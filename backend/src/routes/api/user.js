import { Router } from "express";
import { retrieveDashboardInfo, createUser } from "../../db/daos/userDao";

const router = Router();

const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const HTTP_NOT_FOUND = 404;

router.get("/", async(req,res)=>{
  const dashboard = await retrieveDashboardInfo();
  console.log(dashboard)
  res.json(dashboard);
});

router.post("/", async (req, res) => {
  const { name, uid, email } = req.body;

  const scenario = await createUser(name, uid, email);

  res.status(HTTP_OK).json(scenario);
});

export default router;