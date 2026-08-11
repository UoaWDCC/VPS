import { HttpStatusCode } from "axios";
import { HttpError } from "../util/error.js";
import Group from "../db/models/group.js";
import User from "../db/models/user.js";
import { isValidObjectId } from "../util/validation.js";

async function getEmailByUid(uid) {
  const user = await User.findOne({ uid }, { email: 1 }).lean();
  if (!user) throw new HttpError("user not found", HttpStatusCode.Unauthorized);
  return user.email;
}

export default async function groupAuth(req, _res, next) {
  try {
    const { groupId } = req.params;
    if (!isValidObjectId(groupId))
      throw new HttpError("group not found", HttpStatusCode.NotFound);
    const group = await Group.findById(groupId);
    if (!group) throw new HttpError("group not found", HttpStatusCode.NotFound);

    const email = await getEmailByUid(req.body.uid);

    const membership = group.users.find((member) => member.email === email);
    if (!membership)
      throw new HttpError(
        "not a member of this group",
        HttpStatusCode.Forbidden
      );

    req.body.membership = membership;

    return next();
  } catch (err) {
    return next(err);
  }
}
