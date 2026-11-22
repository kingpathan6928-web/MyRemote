# MyRemote Android WebView APK template (Step 1)

This is a configurable Android project template. It wraps one HTTPS website in an Android WebView. It is **not yet connected to the MyRemote website or Supabase build queue**.

## Configure one generated app

Edit `gradle.properties`:

```properties
APP_NAME=My Store
APPLICATION_ID=com.example.mystore
START_URL=https://your-domain.example/
```

Use a unique valid application ID for each app. `START_URL` must begin with `https://`.

## Build the APK

Open the `android-webview-template` folder in Android Studio (Hedgehog or newer), allow Gradle sync, and install Android SDK Platform 35 when prompted. Then select **Build > Build Bundle(s) / APK(s) > Build APK(s)**. The debug APK is normally created at `app/build/outputs/apk/debug/app-debug.apk`.

A command-line build from this folder is also possible where Gradle 8.9 and Android SDK Platform 35 are installed:

```bash
gradle assembleDebug -PAPP_NAME="My Store" -PAPPLICATION_ID="com.example.mystore" -PSTART_URL="https://your-domain.example/"
```

## Current limitations

- This template requests INTERNET only. Camera, microphone, location, gallery, notifications, wallpaper, SMS, contacts and other native/device capabilities are not implemented here.
- WebView JavaScript and DOM storage are enabled because many websites need them. Local file access is disabled and mixed HTTP content is blocked.
- HTTPS links stay inside the app; non-web schemes are handed to Android to open with an installed app.
- A website's own browser APIs do not automatically grant native Android permissions.
- Before production use, MyRemote's server must validate ownership and defend against SSRF/private-network targets, generate per-project config, sign release APKs securely, and store/download artifacts privately.

## Verification note

The source files and Gradle configuration are included. This workspace does not have Gradle or the Android SDK installed, so an APK compile could not be run here. Do not treat this template as a tested APK until it has been built in Android Studio or an Android build worker.
