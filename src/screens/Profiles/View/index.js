/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Avatar, Button, Icon, ListItem, Text } from '@rneui/themed';
import { StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { requests, url } from 'src/helpers';
import { ScrollView } from 'react-native-gesture-handler';
import { colors, width, font, utils } from 'src/helpers';
import Loading from 'src/components/Loading';

export default function ProfilesView(props) {
    const loggedUser = utils.getUser();
    const {
        navigation,
        route,
        route: {
            params: { itemId = loggedUser?.profile_id },
        },
    } = props;
    const scoreColors = [
        '#0A5A2C', //excellent
        '#7DD8A5', //very good
        '#D9C07E', //good
        '#DA6662', //fair
        '#E1140D', //bad
    ];
    const currency = loggedUser?.currency;
    const [profile, setProfile] = useState();
    const [loading, setLoading] = useState(true);
    const [scoreColor, setScoreColor] = useState(scoreColors[0]);
    const [dashboard, setDashboard] = useState(null);
    const [scoreCardLimit, setScoreCardLimit] = useState(3);

    const isSameUser = loggedUser?.profile_id === itemId;

    async function getDashboardData() {
        try {
            const res = await requests.get(url.User + 'dashboard/');
            setDashboard(res);
        } catch (error) {
            Alert.alert(JSON.stringify(error.data?.detail || error.data || error.message));
        }
    }

    async function getProfile() {
        try {
            const res = await requests.get(
                url.getURL('Profile', { type: 'detail', item: { id: itemId } }),
            );
            setProfile(res);
        } catch (error) {

        }
        setLoading(false);
    }

    useEffect(() => {
        getProfile();
        if (itemId === loggedUser?.profile_id) {
            getDashboardData();
        }
    }, []);

    useEffect(() => {
        setScoreColor(
            getColor(100 - profile?.scorecard?.percentage_paying_late || 0)
        );
    }, [profile?.scorecard]);

    const avatar = profile?.avatar ? { uri: profile?.avatar } : null;
    const user = profile?.user;
    const contact = profile?._contact;

    function getColor(score) {

        let idx = 0;
        if (score > 90) {
            idx = 0;
        }
        else if (score > 80) {
            idx = 1;
        }
        else if (score > 60) {
            idx = 2;
        }
        else if (score > 50) {
            idx = 3;
        }
        else {
            idx = 4;
        }
        return scoreColors[idx];
    }

    if (loading) {
        return <Loading />;
    }

    function onChat() {
        utils.requireLogin(
            () => {
                utils.privateChat({
                    navigation,
                    users: [loggedUser, profile?.user],
                });
            },
            navigation,
            route,
        );
    }
    const editProfile = () => navigation.navigate('Auth/Profile');

    const profileOptions = [
        {
            title: 'Groups',
            subtitle: 'Manage your groups',
            icon: { name: 'users', type: 'feather', color: colors.primary },
            onPress: () => navigation.navigate('Groups'),
            canShow: isSameUser === true,
        },
        {
            title: 'Documents',
            subtitle: !isSameUser ? 'View all shared documents by this user' : 'May be required to verify borrower identity',
            icon: { name: 'attachment', type: 'entypo', color: colors.primary },
            onPress: () => navigation.navigate('Attachments', {
                canSelect: false,
                isSameUser,
                extraQuery: { user__id: profile?.user?.id },
            }
            ),
            canShow: true,
        },
    ].filter(o => o.canShow);

    const phoneNumbersCount = contact?.phone_numbers?.length > 0;

    return (
        <ScrollView>
            <ListItem containerStyle={style.profileContainer}>
                <View>
                    <Avatar
                        source={avatar}
                        title={utils.getAvatarInitials(user?.display_name)}
                        size="large"
                        containerStyle={{ backgroundColor: scoreColor, padding: 8 }}
                        avatarStyle={style.avatar}
                        titleStyle={style.avatarTitle}
                    />
                    <ListItem.Subtitle>{user?.username}</ListItem.Subtitle>
                </View>
                {!!user && <ListItem.Content>
                    <View style={style.flexRow}>
                        <Text style={style.name}>{user?.display_name}</Text>
                        {isSameUser && <TouchableOpacity onPress={editProfile}>
                            <Icon name="pencil" type="evilicon" color={colors.primary} />
                        </TouchableOpacity>}
                    </View>

                    <ListItem.Subtitle style={style.scoreSummary}>
                        Pay Full: {utils.formatNumber(100 - profile?.scorecard?.percentage_default_paying, 0)}%
                        <Icon name="dot-single" type="entypo" size={10} />
                        On Time: {utils.formatNumber(100 - profile?.scorecard?.percentage_paying_late, 0)}%
                    </ListItem.Subtitle>
                    {/* <ListItem.Subtitle>Pay on Time: {utils.formatNumber(100 - profile?.scorecard?.percentage_paying_late)}%</ListItem.Subtitle> */}
                    {isSameUser ?
                        <Text>Balance: {currency} {utils.formatNumber(dashboard?.portfolio_balance || 0)}</Text> :
                        <Button
                            title={'Message'}
                            type={'outline'}
                            buttonStyle={style.messageButton}
                            icon={{ name: 'chat', type: 'entypo', color: colors.grey }}
                            iconPosition="right"
                            onPress={onChat}

                        />}
                </ListItem.Content>}
            </ListItem>

            <View style={style.contact}>
                {profileOptions.map((option, i) => (
                    <ListItem
                        key={`item-${i}`}
                        // bottomDivider
                        onPress={option.onPress}>
                        {!!option.icon && <Icon {...option.icon} />}
                        {!!option.renderIcon && option.renderIcon()}
                        <ListItem.Content>
                            <ListItem.Title>{option.title}</ListItem.Title>
                            <ListItem.Subtitle>{option.subtitle}</ListItem.Subtitle>
                        </ListItem.Content>
                        {!!option.onPress && <ListItem.Chevron />}
                    </ListItem>
                ))}
            </View>



            {phoneNumbersCount > 0 && <View style={style.contact}>
                <View>
                    <Text style={style.phoneNumbersTitle}>Phone Numbers</Text>
                </View>
                <View>
                    {contact?.phone_numbers?.map((phone, i) => (
                        <View
                            key={i}
                            style={style.phoneContainer}
                            onPress={() => utils.openURL(`tel:${phone.phone}`)}
                        >
                            <Text style={style.phone}>{phone.phone}</Text>
                            {true && <View style={style.horizontal}>
                                <View style={style.phoneIconContainer} />
                                <TouchableOpacity onPress={() => utils.openURL(`tel:${phone.phone}`)}>
                                    <Icon
                                        name="phone"
                                        type="entypo"
                                        color={colors.primary}
                                    // size={24}
                                    />
                                </TouchableOpacity>
                            </View>}
                        </View>
                    ))}
                </View>
            </View>}

            {!!dashboard && <View style={style.contact}>
                <Text style={style.phoneNumbersTitle}>Score Card Summary</Text>
                {Object.keys(dashboard.scorecard).filter(key => ![
                    /* data to be excluded */
                    'user_id',
                    'prediction',
                    'age',
                    'income',
                    'sex',
                    'is_married',
                    'number_of_children',
                    'time_at_address',
                    'time_at_current_job',
                    'is_employed',
                    'is_self_employed',
                    'location',
                    /* 'percentage_paying_late',
                    'percentage_default_paying' */
                ].includes(key)).slice(0, scoreCardLimit).map(key => {
                    const value = dashboard.scorecard[key];
                    const label = key.replaceAll('_', ' ').replace('avg', 'average').replace('user', 'you').title();
                    return (
                        <ListItem key={key}>
                            <ListItem.Content>
                                <ListItem.Title>{label}</ListItem.Title>
                                <ListItem.Subtitle>{typeof value === 'number' ? utils.formatNumber(value) : value}</ListItem.Subtitle>
                            </ListItem.Content>
                        </ListItem>
                    );
                }
                )}

                {scoreCardLimit !== undefined && <ListItem onPress={() => setScoreCardLimit(undefined)}>
                    <ListItem.Content>
                        <ListItem.Subtitle>Show More Data</ListItem.Subtitle>
                    </ListItem.Content>
                    <Icon name="chevron-down" type="evilicon" />
                </ListItem>}
            </View>}
        </ScrollView>
    );
}

const style = StyleSheet.create({
    profileContainer: {
        marginTop: 1,
        marginHorizontal: 5,
        paddingBottom: 20,
    },
    contact: {
        marginHorizontal: 5,
        marginVertical: 1,
        // borderRadius: 10,
        backgroundColor: colors.white,
        paddingVertical: 5,
    },
    horizontal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    flexRow: {
        flexDirection: 'row',
    },
    name: {
        fontSize: 20,
        fontFamily: font.medium,
    },
    font12: { fontSize: 12 },
    scoreSummary: {
        fontSize: 12,
        paddingVertical: 10,
    },
    mh5: {
        marginHorizontal: 5,
    },
    phoneIconContainer: {
        marginHorizontal: 10,
    },
    primaryText: {
        color: colors.primary,
    },
    phoneContainer: {
        flexDirection: 'row',
        paddingVertical: 5,
        paddingHorizontal: 6,
        justifyContent: 'space-between',
        // borderColor: 'rgba(0,0,0,0.1)',
        // borderBottomWidth: 0.3,
        // marginBottom: 0,
        marginHorizontal: 10,
    },
    phone: { fontSize: 16 },
    phoneNumbersTitle: {
        fontSize: 18,
        margin: 10,
        marginTop: 20,
        marginBottom: 10,
        fontFamily: font.medium,
        // color: colors.primary,
        fontWeight: '600',
    },
    avatar: {
        backgroundColor: 'rgba(0,0,0,0.1)',
        margin: 0,
    },
    avatarTitle: {
        color: colors.white,
    },
    messageButton: {
        height: 30,
        paddingVertical: 0,
        minWidth: 0.35 * width,
        marginTop: 6,
    },
});
