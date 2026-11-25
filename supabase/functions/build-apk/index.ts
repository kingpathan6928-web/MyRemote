const corsHeaders = {
  "Access-Control-Allow-Origin": "https://salman-pied-ten.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const jsonResponse = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const githubToken = Deno.env.get("GITHUB_TOKEN");
    if (!supabaseUrl || !supabaseAnonKey || !githubToken) return jsonResponse({ error: "Build service is not configured" }, 500);
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return jsonResponse({ error: "Please sign in first" }, 401);
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: supabaseAnonKey, Authorization: authorization } });
    if (!userResponse.ok) return jsonResponse({ error: "Invalid login session" }, 401);
    const user = await userResponse.json();
    const body = await req.json();
    const appName = String(body.app_name ?? "").trim();
    const applicationId = String(body.application_id ?? "").trim();
    const startUrl = String(body.start_url ?? "").trim();
    const iconPath = String(body.icon_path ?? "").trim();
    if (!appName || appName.length > 50) return jsonResponse({ error: "App name is required (maximum 50 characters)" }, 400);
    if (!/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/.test(applicationId)) return jsonResponse({ error: "Invalid Android application ID" }, 400);
    let parsedUrl: URL;
    try { parsedUrl = new URL(startUrl); } catch { return jsonResponse({ error: "Enter a valid website URL" }, 400); }
    if (parsedUrl.protocol !== "https:" || parsedUrl.username || parsedUrl.password || parsedUrl.port || !parsedUrl.hostname.includes(".")) return jsonResponse({ error: "Use a public HTTPS website URL" }, 400);
    if (iconPath && (!iconPath.startsWith(`${user.id}/`) || iconPath.includes(".."))) return jsonResponse({ error: "Invalid icon path" }, 400);
    let iconUrl = "";
    if (iconPath) {
      const signResponse = await fetch(`${supabaseUrl}/storage/v1/object/sign/app-assets/${iconPath}`, { method: "POST", headers: { apikey: supabaseAnonKey, Authorization: authorization, "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn: 3600 }) });
      if (!signResponse.ok) return jsonResponse({ error: "Could not prepare the app icon" }, 500);
      const signedPath = String((await signResponse.json()).signedURL ?? "");
      iconUrl = signedPath.startsWith("http") ? signedPath : `${supabaseUrl}/storage/v1${signedPath}`;
    }
    const dispatch = await fetch("https://api.github.com/repos/kingpathan6928-web/MyRemote/actions/workflows/android-apk.yml/dispatches", { method: "POST", headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${githubToken}`, "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" }, body: JSON.stringify({ ref: "main", inputs: { app_name: appName, application_id: applicationId, start_url: parsedUrl.toString(), icon_url: iconUrl } }) });
    if (dispatch.status !== 204) return jsonResponse({ error: "GitHub could not start the APK build", github_status: dispatch.status }, 502);
    return jsonResponse({ success: true, status: "queued", message: "APK build request sent to GitHub Actions" }, 202);
  } catch (error) {
    console.error("build-apk error", error);
    return jsonResponse({ error: "Invalid request or build service error" }, 400);
  }
});
