export default function getImageUrl(image: string) {
  return `${process.env.EXPO_PUBLIC_BACKEND_URL}/storage/${image}`;
}
