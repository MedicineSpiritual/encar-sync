export function buildHQImage(path) {

  if (!path) return null;

  return (
    "https://ci.encar.com/carpicture" +
    path +
    "?impolicy=heightRate"
  );
}
