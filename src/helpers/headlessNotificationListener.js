/**
 * Note that this method MUST return a Promise.
 * Is that why I'm using a async function here.
 * process notification if is a valid transaction message, 
 * TODO: if true, show local notification and ask to save the transaction
 */
import nlpProviders from 'src/helpers/nlpbomba/providers';
import nlpUtils from 'src/helpers/nlpbomba/utils';
import { requests, url, storage, utils } from 'src/helpers';
const DEBUG = false;

export async function saveTransaction({ text, description, title = '', selectedIntent, user, notification, category = 'Mobile Wallet', source = 'Notifications' } = {}) {
    const {
        accountName,
        amount,
        currency: amount_currency,
        provider,
        isAmountIn,
        confirmationCode
    } = selectedIntent;

    const data = [
        {
            description: description || text,
            amount,
            user,
            amount_currency,
            transaction_type: isAmountIn ? "income" : "spending",
            category: {
                name: category,
                user,
            },
            transaction_at: new Date(),
            tags: {
                create: [
                    { name: source, user },
                    { name: provider, user },
                    { name: accountName.title(), user },
                    { name: confirmationCode, user },
                    { name: title, user },
                ].filter(tag => !!tag.name)
            },
            data: {
                nlp: selectedIntent,
                notification
            }
        }
    ]
    return await requests.post(url.spendi.Transaction + 'bulk_create/', data);
}

export default async function headlessNotificationListener(data) {
    const notification = JSON.parse(data.notification);
    if (notification?.text || notification?.groupedMessages?.length > 0) {
        /**
         * Notifications are catched within the app.
         * if nlpUtils.getIntents confidence is >lim then post it as transaction
         */
        // delete big unnecessary data
        notification.icon = null;
        notification.iconLarge = null;
        const loggedUser = utils.getUser()
        const user = loggedUser?.id;
        notification.groupedMessages.concat([{ title: notification.title, text: notification.text }]).map(async ({ title, text }) => {
            const allNotifications = storage.get(storage.allNotificationsKey) || [];
            // only process notifications which haven't been processed before;
            if (!allNotifications.map(n => n.notification?.text).includes(text)) {
                const results = nlpUtils.getIntents(nlpProviders, text);
                const selectedIntent = results.intents[0]
                storage.set(storage.allNotificationsKey, [...allNotifications, { notification, results }])
                if (selectedIntent.amount && selectedIntent.confidence > 0.6) {
                    const newTransaction = saveTransaction({
                        text,
                        selectedIntent,
                        user,
                        notification,
                        description: selectedIntent.accountName
                    });
                    DEBUG && console.log('newTransaction', JSON.stringify(newTransaction, null, 2))
                } else {
                    DEBUG && console.log(`Not saved because low confidence or no amount=${selectedIntent}.`, selectedIntent.confidence)
                }
            } else {
                DEBUG && console.log('Already processed', title, text)
            }
        })
    } else {
        DEBUG && console.log('not valid message', notification?.text, notification?.groupedMessages?.length > 0)
    }
}
