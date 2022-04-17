# Jeje - Budgeting app
The aim is to make recording transaction as simple as possible

# clean entire project
watchman watch-del-all && rm -rf yarn.lock package-lock.json node_modules && rm -rf android/app/build && rm -rf ios/Pods ios/Podfile.lock && rm -rf ~/Library/Developer/Xcode/DerivedData && yarn install && cd ios && pod update && cd ..

