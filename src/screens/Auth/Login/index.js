/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView, Platform,
  View, KeyboardAvoidingView
} from 'react-native';
import Image from 'react-native-fast-image';
import { Text, } from 'react-native-paper';
import { useRecoilState } from 'recoil';
import { localNotificationState } from 'src/atoms';
import {
  utils,
  DEBUG,
  width,
  height,
  requests,
  setAuthorization,
  colors,
  font,
  url,
} from 'src/helpers';
import Input, { PhoneInput } from 'src/components/Input';
import { Button } from 'src/components';
import { useForm, Controller } from 'react-hook-form';
import Onboarding from 'react-native-onboarding-swiper';
import logo from 'src/assets/logo.png'
import FastImage from 'react-native-fast-image';

export default function Login(props) {
  const {
    navigation,
    route: { params = {} },
  } = props;
  const [, setLocalNotification] = useRecoilState(localNotificationState);
  const [action, setAction] = useState(params?.action || 'signup');
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  function readTnC() {
    utils.openURL(url.tnc);
  }

  const actionMap = {
    login: {
      title: 'Sign In',
      action: 'Sign In',
      actionTeaser: 'Already have an account?',
      subtitle: 'Welcome Back. We missed you!',
      actions: ['signup'],
      help: <Text style={style.grey} onPress={() => setAction('forgotPassword')}>Forgot password? <Text style={style.underline}>Reset</Text></Text>,
    },
    signup: {
      title: 'Boost your Financial Status',
      subtitle: 'Join today and connect with friends who are willing to boost you financially.',
      help: <Text onPress={readTnC}>
        By signing up you agree to <Text onPress={readTnC} style={style.link}>our terms and conditions</Text></Text>,
      actionTeaser: 'You are new here?',
      action: 'Sign Up',
      actions: ['login'],
    },
    forgotPassword: {
      subtitle: 'You are not alone. This happens to the best of us',
      help: 'An email with a security code will be sent to you',
      action: 'Forgot Password',
      title: 'Forgot Password',
      actions: ['login', 'signup'],
    },
    resetPassword: {
      help: 'An email with security code was sent to your email. Input it and set a new password',
      action: 'Reset Password',
      title: 'Reset Password',
      actions: ['login', 'signup'],
    },
    introduction: {
      help: 'A billion reasons why you should choose us',
      action: 'Introduction',
      title: 'Introduction',
      actions: ['login', 'signup'],
    },
  };
  const actionName = actionMap[action].action;
  const otherActions = actionMap[action].actions;
  const helpText = actionMap[action].help;
  const subtitle = actionMap[action].subtitle;

  useEffect(() => {
    if (params.notification) {
      setLocalNotification(params.notification);
    }
  }, []);

  useEffect(() => {
    navigation.setOptions({
      title: showOnboarding ? '' : actionMap[action].title,
      headerShown:!showOnboarding,
    });
    setGeneralError('');
  }, [action, showOnboarding]);

  const inputs = [
    [
      {
        placeholder: 'First Name',
        label: 'First Name',
        name: 'first_name',
        actions: ['signup'],
        rules: { required: true },
        // leftIcon:{name:"envelope", color:"black", type:"evilicon"}
      },
    ],
    [
      {
        placeholder: 'Last Name',
        label: 'Last Name',
        name: 'last_name',
        actions: ['signup'],
        rules: { required: true },
        // leftIcon:{name:"envelope", color:"black", type:"evilicon"}
      },
    ],
    [{
      placeholder: 'Enter Email',
      label: 'Email',
      name: 'email',
      autoCapitalize: 'none',
      actions: ['forgotPassword'],
      assistiveText: action === 'signup' ? 'Will be required to reset your password' : undefined,
      rules: { required: false },
      // leftIcon:{name:"envelope", color:"black", type:"evilicon"}
    }],
    {
      placeholder: 'Enter Phone',
      // label: 'Phone Number',
      name: 'username',
      autoCapitalize: 'none',
      keyboardType: 'phone-pad',
      actions: ['login', 'signup'],
      rules: { required: true },
      // leftIcon:{name:"envelope", color:"black", type:"evilicon"}
    },
    [{
      placeholder: 'Enter OTP',
      label: 'Security Code',
      name: 'otp',
      autoCapitalize: 'none',
      keyboardType: 'decimal-pad',
      actions: ['resetPassword'],
      rules: { required: true },
      // leftIcon:{name:"envelope", color:"black", type:"evilicon"}
    }],
    [
      {
        placeholder: 'Enter Password',
        label: 'Password',
        name: 'password',
        autoCapitalize: 'none',
        togglePassword: true,
        isPassword: true,
        secureTextEntry: true,
        actions: ['login', 'signup', 'resetPassword'],
        rules: { required: true, minLength: 4 },
        customShowPasswordComponent: <Text>Show</Text>,
        customHidePasswordComponent: <Text>Hide</Text>,
        // leftIcon:{name:"key-outline", color:"black", type:"ionicon"}
      },
      {
        placeholder: 'Confirm',
        label: 'Confirmation',
        name: 'password2',
        autoCapitalize: 'none',
        secureTextEntry: true,
        rules: { required: true, minLength: 4 },
        actions: ['signup', 'resetPassword'],
        // leftIcon:{name:"key-outline", color:"black", type:"ionicon"}
      },
    ],
  ];

  const validation = {
    first_name: { required: { value: true, message: 'First name is required' } },
    last_name: { required: { value: true, message: 'Last name is required' } },
    email: {
      required: { value: true, message: 'Email is required' },
      pattern: {
        value:
          /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        message: 'Invalid Email Format',
      },
    },
    username: {
      required: { value: true, message: 'Phone number is required' },
      minLength: { value: 10, message: 'Invalid phone number' },
    },
    password: {
      required: { value: true, message: 'Password is required' },
      minLength: { value: 4, message: 'Password must be at least 4 characters' },
    },
    password2: {
      required: { value: true, message: 'Confirm password' },
      validate: value => value === getValues('password') || 'Passwords do not match',
    },
  };

  const getErrorMessage = key => {
    let error = errors[key];
    if (error) {
      return validation[key][error.type]?.message || error.type;
    } else {
      return null;
    }
  };

  const {
    register,
    setValue,
    getValues,
    setError,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: {} }, validation);

  const onLogin = async token => {
    /*
      set token, get user profile, save and navigate away
    */
    setAuthorization(token);
    const loggedUser = await requests.get(url.user);
    utils.setUser({ ...loggedUser, token });
    if (!loggedUser?.is_phone_verified) {
      return navigation.navigate('Auth/VerifyPhone');
    } else {
      const { nextPage, nextParams = {} } = params;
      if (nextPage) {
        navigation.navigate(nextPage, nextParams);
      } else {
        navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard');
      }
    }
  };

  useEffect(() => {
    // check if user is logged in and simply redirect
    const loggedUser = utils.getUser();
    if (loggedUser?.token) {
      onLogin(loggedUser?.token);
    }
  }, []);

  const onSubmit = async data => {
    const onError = error => {
      setGeneralError(error.message?.includes('Server') ? 'An ccount for this number already exists. Login instead' : JSON.stringify(error.data || error.message));
    };
    if (action === 'signup') {
      try {
        // console.log("data ", data)
        setLoading(true);
        const res = await requests.post(url.register, data);
        setGeneralError('');
        DEBUG && console.log('onsignup', res, data);
        if (res.token || res.key) {
          onLogin(res.token || res.key);
        } else {
          onError(res);
        }
      } catch (error) {
        onError(error);
      }
      setLoading(false);
    } else if (action === 'login') {
      try {
        setLoading(true);
        const res = await requests.post(
          url.login,
          data,
          { withCredentials: false },
        );
        setGeneralError('');
        if (res.key) {
          onLogin(res.key);
        } else {
          onError(res);
        }
      } catch (error) {
        onError(error);
      }
      setLoading(false);
    } else if (action === 'forgotPassword') {
      const { email } = data;
      try {
        setLoading(true);
        const res = await requests.post(url.User + 'request_otp/', { email }, { withCredentials: false });
        DEBUG && console.log('onReset', res, data);
        if (res.success) {
          setAction('resetPassword');
        } else {
          setGeneralError(res.errors?.join('\n'));
        }
      } catch (error) {
        onError(error);
      }
      setLoading(false);
    } else if (action === 'resetPassword') {
      const { email, otp, password } = data;
      try {
        setLoading(true);
        const res = await requests.post(url.User + 'verify_otp/', { email, otp, password }, { withCredentials: false });
        DEBUG && console.log('onVerify OTP', res, data);
        if (res.success) {
          setAction('login');
        } else {
          setGeneralError(res.errors.join('\n'));
        }
      } catch (error) {
        onError(error);
      }
      setLoading(false);
    }

  };

  function onDoneTour() {
    setShowOnboarding(!showOnboarding);
  }

  function login() {
    setAction('login');
    onDoneTour();
  }

  return (
    <View style={style.root}>
      {showOnboarding ? <>
        <Onboarding
          bottomBarColor={'white'}
          bottomBarHighlight={true}
          onDone={onDoneTour}
          onSkip={onDoneTour}
          containerStyles={style.onboard}
          subTitleStyles={style.subTitleStyles}
          titleStyles={style.titleStyles}
          skipLabel={''}
          nextLabel={''}
          pages={[
            {
              backgroundColor: '#fff',
              image: <Image
                source={require('src/assets/onboarding/p2p.jpg')}
                style={style.onboardImage}
                resizeMode="contain"
              />,
              title: 'P2P Lending & Borrowing',
              subtitle: 'Connect with people from your contacts to know who can offer you a quick loan.',
            },
            {
              backgroundColor: '#fff',
              image: <Image
                source={require('src/assets/onboarding/loanPortifolio.gif')}
                style={style.onboardImage}
                resizeMode="contain"
              />,
              title: 'Loan Portfolio',
              subtitle: 'Create groups and choose who sees your loan offering portfolio',
            },
            {
              backgroundColor: '#fff',
              image: <Image
                source={require('src/assets/onboarding/creditScore.jpg')}
                style={style.onboardImage}
                resizeMode="contain"
              />,
              title: 'Credit Score',
              subtitle: 'Before giving a loan to your peers, quickly identify peers likelihood to pay you back on time',
            },
          ]}
        />
        <View style={style.actionButtons}>
          <Button title={'Sign Up'.toUpperCase()} type={'solid'} onPress={onDoneTour} />
          <View style={style.actionButtonDivider} />
          <Button title={'Log In'.toUpperCase()} type="outline" onPress={login} />
        </View>
      </> :
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView>
            <View>
              <FastImage source={logo} style={style.logo} />
              <Text style={style.appName}>Niwezeshe</Text>
            </View>
            <Text style={style.subtitleText}>{subtitle}</Text>
            <View style={style.container}>
              {inputs
                .filter(i => Array.isArray(i) || i.actions?.includes(action))
                .map((input, index) => (
                  <View key={`i-${index}`}>
                    {!Array.isArray(input) ? (
                      <Controller
                        control={control}
                        validation={validation[input.name]}
                        render={({ field: { onChange, onBlur, value } }) => (
                          input.keyboardType !== 'phone-pad' ? <Input
                            // style={styles.input}
                            onBlur={onBlur}
                            onChangeText={_value => onChange(_value)}
                            value={value}
                            errorMessage={getErrorMessage(input.name)}
                            {...input}
                            containerStyle={style.inputContainer}
                          /> : <PhoneInput
                            onBlur={onBlur}
                            {...input}
                            onChange={(param) => {
                              if (param.valid !== undefined) {
                                onChange(param.value);
                              }
                            }}
                            style={style.phoneInput}
                            placeholder={'Enter Phone Number'}
                          // errorMessage={getErrorMessage(input.name)}
                          />
                        )}
                        name={input.name}
                        rules={input.rules || {}}
                      />
                    ) : (
                      <View
                        key={`input-${index}`}
                        style={style.horizontalSpaceBtnFlex1}>
                        {input
                          .filter(i => i.actions?.includes(action))
                          .map((_input, j) => (
                            <Controller
                              key={`control-${j}`}
                              control={control}
                              validation={validation[_input.name]}
                              render={({ field: { onChange, onBlur, value } }) => (
                                input.keyboardType !== 'phone-pad' ? <Input
                                  containerStyle={
                                    input.filter(i => i.actions?.includes(action))
                                      .length > 1
                                      ? style.horizontalInput
                                      : {}
                                  }
                                  onBlur={onBlur}
                                  onChangeText={_value => onChange(_value)}
                                  value={value}
                                  errorMessage={getErrorMessage(_input.name)}
                                  {..._input}
                                /> : <PhoneInput
                                  {..._input}
                                  style={style.phoneInput}
                                  onChange={(_params) => onChange(_params.value)}
                                />
                              )}
                              name={_input.name}
                              rules={_input.rules || {}}
                            />
                          ))}
                      </View>
                    )}
                  </View>
                ))}
              {!!generalError && (
                <Text style={style.errorText}>{generalError}</Text>
              )}
              <Text style={style.helpText}>{helpText}</Text>
              <Button
                disabled={loading}
                loading={loading}
                buttonStyle={style.submitButton}
                onPress={handleSubmit(onSubmit)}
                title={(loading ? 'Wait...' : actionName)}
              />
              <View style={style.otherActionsContainer}>
                {otherActions
                  // .filter(i => i !== 'forgotPassword')
                  .map((option, index) => (
                    <TouchableOpacity
                      style={style.otherActionsContainer}
                      key={`option-${index}`}
                      onPress={() => option === 'introduction' ? onDoneTour() : setAction(option)}>
                      <Text>
                        {actionMap[option].actionTeaser}{' '}
                        <Text style={style.actionNameOther}>
                          {actionMap[option].action}
                        </Text>
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>}
    </View>
  );
}

const style = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },

  onboard: {
   padding: 10,
    width,
   
  },
  onboardImage: {
    height: 0.4 * width,
    width: 0.6 * width,
    padding: 0,
  },
  logo: { width: 40, height: 40 },
  subtitleText: {
    paddingHorizontal: 25,
    color: 'gray',
    marginVertical: 10,
  },
  container: {
    paddingHorizontal: 15,
    margin: 10,
    // paddingTop: 50,
    paddingBottom: 40,

  },
  horizontal: {
    flexDirection: 'row',
  },
  horizontalSpaceBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  horizontalSpaceBtnFlex1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  actionNameOther: {
    fontFamily: font.regular,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  otherActionsContainer: {
    // flexDirection: 'row-reverse',
    // justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 0,
    paddingTop: 15,
    alignSelf: 'center',
    alignItems: 'center',
    width: "100%",
    // backgroundColor: colors.backgroundColor2,
  },
  divider: { paddingVertical: 10 },
  submitButton: {
    // backgroundColor: colors.primary,
    marginTop: 50,
    marginHorizontal: 10,
    minWidth: 100,
    // height: 40,
    borderRadius: 10,
    alignItems: 'center',
    padding: 'auto',
  },
  actionNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    paddingTop: 15,
  },
  actionNameContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    // justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 20,
  },
  helpText: {
    paddingTop: 10,
    paddingLeft: 4,
  },
  errorText: {
    paddingVertical: 10,
    paddingLeft: 10,
    color: colors.danger,
  },
  horizontalInput: { width: 0.4 * width },
  phoneInput: {
    // borderColor: "grey",
    // borderWidth: 1, borderRadius: 10,
    // paddingLeft: 20, marginBottom: 20,
    fontFamily: font.regular, fontSize: 20,
  },
  inputContainer: {
    borderColor: 'grey',
    borderWidth: 1, borderRadius: 10,
    paddingLeft: 20, marginBottom: 20,
    fontFamily: font.regular, fontSize: 20,
  },
  link: { color: colors.link },
  //onboard
  center: { alignItems: 'center' },
  welcomeText: { marginBottom: 50, paddingTop: 30, fontFamily: font.bold, fontSize: 21 },
  underline: { textDecorationLine: 'underline' },
  onboardSignUp: { width: 0.6 * width },
  actionButtonDivider: { height: 30 },
  actionButtons: { marginTop: 40, marginBottom: 0.15 * height, paddingHorizontal: 0.2 * width },
  logo: { width: 40, height: 40, alignSelf: 'center' },
  appName: { textAlign: 'center', color: colors.primary, fontSize: 20, paddingBottom: 10 },
  grey:{ color: colors.grey },
  subTitleStyles:{lineHeight:28, fontFamily: font.light},
  titleStyles: {fontFamily: font.regular, fontWeight: '600', backgroundColor:'blue'},
});
