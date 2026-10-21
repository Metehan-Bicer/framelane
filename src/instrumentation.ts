export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startDemoResets } = await import("@/lib/demo/schedule");
    startDemoResets();
  }
}
