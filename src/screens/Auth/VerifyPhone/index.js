/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useEffect, useReducer } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Text, Button } from 'react-native-elements';
import useState from 'react-usestateref';
import { colors, utils, requests, url, width} from 'src/helpers';
import _ from 'lodash';
import { PhoneInput } from 'src/components/Input';
import OtpInputs from 'react-native-otp-inputs';
import auth from '@react-native-firebase/auth';
const OTP_RESEND_TIME = 31; //sec

function resendOTPAfterSecReducer(state, action) {
    let newState;
    switch (action.type) {
        case 'increase':
            newState = state + 1;
            break;
        case 'decrease':
            newState = state - 1;
            break;
        default:
            return OTP_RESEND_TIME;
    }
    return newState;
}


export default function VerifyPhone(props) {
    const {navigation, route} = props;
    const [loggedUser] = useState(utils.getUser());
    const [otp, setOtp] = useState();
    const [success, setSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [alert, setAlert] = useState({ type: 'info', message: 'Please wait for OTP to be sent..' });
    const [phone, setPhone] = useState(loggedUser?.username); //""
    const [isPhoneValid, setIsPhoneValid] = useState(phone?.length === 13);
    const [confirm, setConfirm] = useState(null);
    const [authenticationType, setAuthenticationType] = useState('firebase');
    const [canResendOTP, setCanResendOTP] = useState(false);
    const [resendOTPAfterSec, dispatchResendOTPAfterSec] = useReducer(resendOTPAfterSecReducer, OTP_RESEND_TIME);

    const otpRef = useRef();

    const focusOTP = () => {
        otpRef.current?.focus();
    };

    const resetOTP = () => {
        otpRef.current.reset();
    };

    async function verify({ isVerified = false, code } = {}) {
        if (!isPhoneValid || phone?.length < 11) {
            setErrorMessage('This phone number is not valid');
        } else {
            if (authenticationType === 'firebase' && !isVerified) {
                firebaseVerify();
            } else {
                try {
                    setErrorMessage(null);
                    const res = await requests.post(url.User + 'verify_otp/', { otp: code || otp, phone });
                    if (res.success) {
                        setSuccess(true);
                        utils.setUser({ ...loggedUser, is_phone_verified: true });
                        setErrorMessage(null);
                    } else {
                        setErrorMessage(res.errors.join('; '));
                    }
                } catch (e) {
                    setErrorMessage(JSON.stringify(e.data?.detail || e.data || e.message));
                }
            }
        }
    }

    async function requestOTP() {
        setErrorMessage(null);
        setCanResendOTP(false);
        resetOTP();
        if (authenticationType === 'firebase') {
            firebaseRequestOTP();
        } else {
            try {
                const res = await requests.post(url.User + 'request_otp/', { phone });
                if (res.success) {
                    setAlert({ message: 'Check your message for verification code', type: 'info' });
                    focusOTP();
                } else {
                    if (res.errors?.length > 0) {
                        setErrorMessage(res.errors.join('; '));
                    } else {
                        setErrorMessage(JSON.stringify(res));
                    }
                    setAlert({});
                }
            } catch (e) {
                setErrorMessage(JSON.stringify(e.data?.detail || e.data || e.message));
                setAlert({});
            }
        }
    }

    async function firebaseRequestOTP() {
        try {
            const confirmation = await auth().signInWithPhoneNumber(phone);
            setConfirm(confirmation);
            // const masked = '**********' + phone.substr(-4); // eg ************3456
            setAlert({ message: `The OTP was sent to your phone number ${phone}`, type: 'info' });
            setErrorMessage('');
            focusOTP();
        } catch (e) {
            //   if sending otp fails change authentication message to local messages
            if (['auth/quota-exceeded', 'auth/missing-client-identifier'].includes(e.code)) {
                setAuthenticationType('sms');
            }
            setErrorMessage(e.code || JSON.stringify(e.message));
            setAlert({});
        }
    }

    async function firebaseVerify() {
        try {
            if (confirm) {
                await confirm.confirm(otp);
                setErrorMessage('');
                setAlert({ message: 'All clear. OTP confirmed. Waiting for further verification...', type: 'info' });
                setTimeout(() => {
                    // confirm the otp remotely too
                    verify({ isVerified: true, code: `firebase-${otp}` });
                }, 2000);
            } else {
                // in this case firebase verification is not intialized yet
                setAuthenticationType('sms');
            }
        } catch (error) {
            setErrorMessage(error.message || 'Invalid OTP. Please try again');
            setAlert({});
        }
    }

    function logout() {
        utils.logout();
        navigation.replace('Auth/Login');
    }

    useEffect(() => {
        if (isPhoneValid) {
            setTimeout(requestOTP, 1e3);
        }
    }, [authenticationType]);

    useEffect(() => {
        if (loggedUser?.is_phone_verified || success) {
            if (success && !loggedUser?.currency) {
                // go to profile and edit currency and other details
                navigation.replace('Auth/Profile', {})
            } else {
                navigation.replace('Home', {});
            }
        }
    }, [loggedUser?.is_phone_verified, success]);

    useEffect(() => {
        // total resend OTP every few seconds
        const gate = setInterval(() => {
            !canResendOTP && setCanResendOTP(true);
        }, OTP_RESEND_TIME * 1e3);

        const timer = setInterval(() => {
            // only dispatch action when not allowed to send otp
            !canResendOTP && dispatchResendOTPAfterSec({ type: 'decrease' });
        }, 1e3);

        return () => {
            clearInterval(gate);
            clearInterval(timer);
            dispatchResendOTPAfterSec({ type: 'reset' });
        };

    }, [canResendOTP]);

    useEffect(() => {
        /*
        listen to user state from firebase,
        sometime user phonr get confirmed wothout send messages
        */
        const subscriber = auth().onAuthStateChanged((user) => {
            if (user && user?.phoneNumber === phone) {//they are logged in so just confirm remotely and go on
                verify({ isVerified: true, code: `firebase-${otp}` });
            }
        });
        return subscriber; // unsubscribe on unmount
    }, []);

    const onContactSupport = () => {
        utils.requireLogin(
          () => {
            utils.privateChat({
              navigation,
              name: 'Customer Care',
              users: [loggedUser, { id: 19, username: 'admin' }],
            });
          },
          navigation,
          route,
        );
      };

    return <View style={style.root}>
        <View style={style.card}>
            <PhoneInput
                label={'Phone Number'}
                defaultValue={phone}
                onChange={({ valid, formattedValue, value }) => {
                    setPhone(value);
                    setIsPhoneValid(valid);
                }}
                style={style.phoneInput}
            // errorMessage={phoneError}
            />
            <View style={style.otpContainer}>
                <Text style={style.verificationCodeTitle}>Verification Code</Text>
                <OtpInputs
                    keyboardType="phone-pad"
                    handleChange={(code) => setOtp(code)}
                    numberOfInputs={6}
                    // autoFocus
                    clearTextOnFocus
                    ref={otpRef}
                    selectTextOnFocus={false}
                    inputStyles={style.otpInput}
                    style={style.otpInputs}
                />
                {!!errorMessage && <Text style={style.errorMessage}>{errorMessage}</Text>}
                <Button
                    title={canResendOTP ? 'Resend OTP' : `Resend After ${resendOTPAfterSec} sec`}
                    onPress={requestOTP}
                    disabled={!canResendOTP}
                    type="outline"
                />
                {!!alert?.message && <Text style={style.alertText}>{alert.message}</Text>}
            </View>
            {isPhoneValid && otp?.length === 6 && <Button title="Verify" onPress={verify} containerStyle={style.verifyContainer} />}
            {canResendOTP && <TouchableOpacity style={style.contactSupport} onPress={onContactSupport}>
                <Text>OTP not received? <Text style={style.underline}>Contact Support</Text></Text>
            </TouchableOpacity>}
        </View>
 
        <Button type="outline" title={'Logout'} onPress={logout} containerStyle={style.logout} />
    </View>;
}

const style = StyleSheet.create({
    root: {
        // paddingHorizontal:20,
        paddingTop: 0,
        // backgroundColor:"white",
    },
    contactSupport:{
        alignItems:"center", marginTop:20
    },
    underline:{textDecorationLine:"underline"},
    alertText: { color: 'white', marginTop: 20 },
    errorMessage: { color: 'orange', marginVertical: 10 },
    phoneInput: {
        fontSize: 22,
        paddingLeft: 10,
        marginTop: 20,
    },
    verificationCodeTitle: {
        marginVertical: 10, fontSize: 20, color: 'white', fontWeight: 'bold',
    },
    otpContainer: {
        padding: 20,
        backgroundColor: colors.primary,
        borderRadius: 10,
    },
    verifyContainer: { marginHorizontal: 30, paddingVertical: 40 },
    otpInputs: { flexDirection: 'row', alignSelf: 'center' },
    otpInput: {
        backgroundColor: colors.backgroundColor,
        marginRight: 2,
        width: 0.116 * width,
        marginBottom: 10,
        fontSize: 28,
        alignSelf: 'center',
        textAlign: 'center',
        color: colors.black,
    },
    card: { backgroundColor: 'white', margin: 15, borderRadius: 10, paddingVertical: 50, paddingHorizontal: 20 },
    logout: { width: 0.6 * width, marginTop: 10, alignSelf: 'center' },
});
