export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startDemoCleanup } = await import("@/lib/demo/schedule");
    startDemoCleanup();
  }
}
