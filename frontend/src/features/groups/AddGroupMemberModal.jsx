import { useEffect, useMemo, useState } from "react";
import ModalDialog from "../../components/ModalDialogue";

const getInitialMember = (groupNumbers) => ({
  name: "",
  email: "",
  role: "",
  group: groupNumbers[0] ?? "1",
});

export default function AddGroupMemberModal({
  open,
  onClose,
  onSubmit,
  groupNumbers,
  roles,
  isSaving,
}) {
  const [member, setMember] = useState(() => getInitialMember(groupNumbers));
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setMember(getInitialMember(groupNumbers));
      setSubmitted(false);
    }
  }, [groupNumbers, open]);

  const isSubmittable = useMemo(
    () =>
      Boolean(
        member.name.trim() &&
          member.email.trim() &&
          member.role.trim() &&
          member.group.trim()
      ),
    [member]
  );

  function updateMember(field, value) {
    setMember((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit() {
    setSubmitted(true);
    if (!isSubmittable || isSaving) return;

    onSubmit({
      name: member.name.trim(),
      email: member.email.trim(),
      role: member.role.trim(),
      group: member.group.trim(),
    });
  }

  return (
    <ModalDialog title="Add Group Member" open={open} onClose={onClose}>
      <fieldset className="fieldset gap-s">
        <label className="label">Name</label>
        <input
          className="input w-full"
          type="text"
          value={member.name}
          onChange={(event) => updateMember("name", event.target.value)}
        />

        <label className="label">Email</label>
        <input
          className="input w-full"
          type="email"
          value={member.email}
          onChange={(event) => updateMember("email", event.target.value)}
        />

        <label className="label">Role</label>
        <input
          className="input w-full"
          type="text"
          list="group-member-role-options"
          value={member.role}
          onChange={(event) => updateMember("role", event.target.value)}
        />
        <datalist id="group-member-role-options">
          {roles.map((role) => (
            <option key={role} value={role} />
          ))}
        </datalist>

        <label className="label">Group Number</label>
        <input
          className="input w-full"
          type="text"
          list="group-member-number-options"
          value={member.group}
          onChange={(event) => updateMember("group", event.target.value)}
        />
        <datalist id="group-member-number-options">
          {groupNumbers.map((group) => (
            <option key={group} value={group} />
          ))}
        </datalist>
      </fieldset>

      {submitted && !isSubmittable ? (
        <p className="text-error text-s mt-s">
          Name, email, role and group number are required.
        </p>
      ) : null}

      <div className="modal-action flex gap-2">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className={`btn ${!isSubmittable || isSaving ? "btn-disabled" : ""}`}
          disabled={!isSubmittable || isSaving}
          onClick={handleSubmit}
        >
          {isSaving ? "Adding..." : "Add Member"}
        </button>
      </div>
    </ModalDialog>
  );
}
