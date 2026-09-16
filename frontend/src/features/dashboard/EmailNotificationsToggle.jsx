import { useContext, useState } from "react";
import AuthenticationContext from "../../context/AuthenticationContext";
import { useGet, usePatch } from "../../hooks/crudHooks";
import { MailIcon } from "lucide-react";
import toast from "react-hot-toast";

// Lets a user turn "your turn" email notifications on/off for one scenario.
export default function EmailNotificationsToggle({ scenarioId }) {
  const { user, getUserIdToken } = useContext(AuthenticationContext);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [saving, setSaving] = useState(false);

  useGet(
    user ? `/api/${user.uid}` : null,
    (data) => {
      const [record] = Array.isArray(data) ? data : [data];
      if (record) {
        setEmailNotifications(
          record.emailNotifications?.[scenarioId] !== false
        );
      }
    },
    true,
    !user
  );

  const toggle = async (e) => {
    const checked = e.target.checked;
    setEmailNotifications(checked);
    setSaving(true);
    const res = await usePatch(
      `/api/${user.uid}/${scenarioId}/settings`,
      { emailNotifications: checked },
      getUserIdToken
    );
    setSaving(false);
    if (res?.status) {
      setEmailNotifications(!checked);
      toast.error("Failed to update notification settings.");
    }
  };

  return (
    <label className="label cursor-pointer gap-2">
      <MailIcon size={16} />
      <span className="text-m">Email notifications</span>
      <input
        type="checkbox"
        className="toggle"
        checked={emailNotifications}
        disabled={saving}
        onChange={toggle}
      />
    </label>
  );
}
