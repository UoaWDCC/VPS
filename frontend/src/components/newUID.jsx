export default function generateUID() {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const uidLength = 28;
  let uid = "";
  for (let i = 0; i < uidLength; i += 1) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    uid += charset.charAt(randomIndex);
  }
  return uid;
}
