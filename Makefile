# code-push app add jeje-android android react-native
# (node:15170) Warning: Accessing non-existent property 'padLevels' of module exports inside circular dependency
# (Use `node --trace-warnings ...` to show where the warning was created)
# Successfully added the "jeje-android" app, along with the following default deployments:
# ┌────────────┬───────────────────────────────────────┐
# │ Name       │ Deployment Key                        │
# ├────────────┼───────────────────────────────────────┤
# │ Production │ A8TyFkmIu4CMPijWp4bB4SLCx3tlMv12PM3TT │
# ├────────────┼───────────────────────────────────────┤
# │ Staging    │ F6W67LXGByzy_V8ZQP5_uDHEKxYgWsssjH04d │

key-generate:
	echo y | keytool -genkeypair -dname "cn=Paschal Giki, ou=ICT, o=giki.hudumabomba.com, c=TZ" \
		-alias jeje -keypass NJSXG5LTNYUHE2NJSX -keystore ./android/app/release.keystore -storepass NJSXG5LTNYUHE2NJSX -validity 200000 -keyalg RSA -keysize 2048

keystore-list:
	keytool -list -v -alias jeje -keystore ./android/app/release.keystore

generate-key:
	keytool -keystore ./android/app/release.keystore -list -v -alias jeje -keypass NJSXG5LTNYUHE2NJSX -storepass NJSXG5LTNYUHE2NJSX


build-bundle:
	cd android && ./gradlew bundleRelease

build-apk:
	cd android && ./gradlew assembleRelease	

update-android:
	echo 'code-push release-react jeje-android android -m --deploymentName Production --description "Bug fixes"'

update-ios:
	echo 'code-push release-react jeje-ios ios -m --deploymentName Production --description "Bug fixes"'

promote-android:
	code-push promote jeje-android Staging Production

promote-ios:
	code-push promote jeje-ios Staging Production

install-debug:
	adb install -r android/app/build/outputs/apk/debug/app-armeabi-v7a-release.apk

install-release:
	adb install -r android/app/build/outputs/apk/release/app-armeabi-v7a-release.apk