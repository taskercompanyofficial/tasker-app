import { BACKEND_URL } from "./api-endpoints";
export default function getImageUrl(image: string) {
  const safeImage = (image || "").trim();
  if (!safeImage) return "";
  if (/^https?:\/\//i.test(safeImage)) return safeImage;
  if (safeImage.startsWith("/")) return `${BACKEND_URL}${safeImage}`;
  if (safeImage.startsWith("storage/")) return `${BACKEND_URL}/${safeImage}`;
  if (safeImage.startsWith("/storage/")) return `${BACKEND_URL}${safeImage}`;
  return `${BACKEND_URL}/storage/${safeImage}`;
}
