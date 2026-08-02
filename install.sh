
Use this from the repo root:

# 1) Prebuild without the GGUF (keeps APK small / AI-free)
mv assets/ai-model/model.gguf assets/ai-model/model.gguf.sideline
npx expo prebuild --platform android --clean
mv assets/ai-model/model.gguf.sideline assets/ai-model/model.gguf
# 2) Build + copy APK
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
cd android && ./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a --no-daemon
cp -f app/build/outputs/apk/release/app-release.apk ../release/oppuna-care-v7-noai.apk
cd ..
# 3) Install
adb install -r release/oppuna-care-v7-noai.apk