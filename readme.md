# Jeje - Budgeting app
The aim is to make recording transaction as simple as possible

# clean entire project
watchman watch-del-all && rm -rf yarn.lock package-lock.json node_modules && rm -rf android/app/build && rm -rf ios/Pods ios/Podfile.lock && rm -rf ~/Library/Developer/Xcode/DerivedData && yarn install && cd ios && pod update && cd ..

# Notes
## all icons used
 'material' | 'material-community' | 'simple-line-icon' | 'zocial' | 'font-awesome' | 'octicon' | 'ionicon' | 'foundation' | 'evilicon' | 'entypo' | 'antdesign' | 'font-awesome-5'


# Roadmap & TODO
1. [Done]August 4, 2022: Add scan QR code. if doesn't exist give option to add, QR code, desciption, amount and etc
2. Backend feature: for transactions with future transaction_at, send a payment reminder if due date is approaching.
3. August 8, 2022: Connect with debt collection module where users can add phone number and status as tags for the debtor to be reminded.




