export function log(msg: string) {
  const time = new Date().toISOString().split("T")[1].split(".")[0];
  console.log(`[${time}] ${msg}`);
}
