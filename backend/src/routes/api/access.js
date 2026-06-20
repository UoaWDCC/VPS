import { Router } from "express";
import { getAccessList, grantAccess, revokeAccess } from "../../db/daos/accessDao.js";
import auth from "../../middleware/firebaseAuth.js";
import { scenarioOwnerAuth } from "../../middleware/scenarioAuth.js";
import { HttpStatusCode } from "axios";
import { isValidEmail } from "../../util/email.js";
import { handle, HttpError } from "../../util/error.js";

// NOTE: these operations are locked to only the scenario owner

const router = Router();

router.use(auth);
router.use(scenarioOwnerAuth);

// // Returns the scenarios the user has view access to dashboard
// router.get("/", async (req, res) => {
//   // res.json("test")
//   const uid = req.body.uid;
//   const accessible = await retrieveAccessibleScenarios(uid);
//
//   return res.status(200).json(accessible);
// });
//

// get the access list
router.get("/:scenarioId", handle(async (req, res) => {
  const { scenarioId } = req.params;
  const access = await getAccessList(scenarioId);
  return res.json(access);
}));

// add a user to the access list
router.put("/:scenarioId", handle(async (req, res) => {
  const { scenarioId } = req.params;
  const { email } = req.body;

  if (!isValidEmail(email)) throw new HttpError("email format is not valid", HttpStatusCode.BadRequest);
  const access = await grantAccess(scenarioId, email);

  return res.json(access);
}));

// remove a user from the access list
router.delete("/:scenarioId", handle(async (req, res) => {
  const { scenarioId } = req.params;
  const { email } = req.body;

  const access = await revokeAccess(scenarioId, email);
  if (!access) throw new HttpError("access object not found for scenario", HttpStatusCode.NotFound);

  return res.json(access);
}));


// router.post("/:scenarioId/create", async (req, res) => {
//   try {
//     const { scenarioId } = req.params;
//     const uid = req.body.uid;
//
//     if (!uid) return res.status(401).json("NO ID UNAUTH");
//
//     const scenario = await retrieveScenario(scenarioId).catch(() => null);
//
//     if (!scenario) return res.status(404).json({ error: "Scenario not found" });
//
//     if (scenario.uid !== uid)
//       return res.status(403).json({ error: "Forbidden" });
//
//     const name = scenario?.name || "Default name";
//
//     const created = await createAccessList(scenarioId, name, scenario.uid);
//     if (!created)
//       return res.status(500).json({ error: "Failed creating access list" });
//
//     return res.status(201).json(created);
//   } catch (err) {
//     res
//       .status(500)
//       .json({ error: "Internal server error", message: err.message });
//     return;
//   }
// });

// router.delete("/:scenarioId", async (req, res) => {
//   try {
//     const { scenarioId } = req.params;
//     const uid = req.body.uid;
//     const result = await deleteAccessList(scenarioId, uid);
//
//     return res.status(200).json(result);
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }
// });

export default router;
