/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView, Platform,
  View, KeyboardAvoidingView, StatusBar,
} from 'react-native';
import { Text, Button, Image, Icon } from '@rneui/themed';
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
  url, LocalizationContext,
} from 'src/helpers';
import Input, { PhoneInput } from 'src/components/Input';
import { useForm, Controller } from 'react-hook-form';
import Onboarding from 'react-native-onboarding-swiper';
import Modal from 'src/components/Modal';

export default function Login(props) {
  const {
    navigation,
    route: { params = {} },
  } = props;
  const { i18n, setAppLanguage, appLanguage } = useContext(LocalizationContext);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [, setLocalNotification] = useRecoilState(localNotificationState);
  const [action, setAction] = useState(params?.action || 'signup');
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    // dummy state update to refresh page
    setGeneralError('');
  }, [appLanguage]);

  function readTnC() {
    navigation.navigate('Web', { uri: url.tnc, title: i18n.t('Terms and Conditions') });
  }

  const actionMap = {
    login: {
      title: i18n.t('Sign In'),
      action: i18n.t('Sign In'),
      actionTeaser: i18n.t('Already have an account?'),
      subtitle: i18n.t('auth_login_we_missed_you'),
      actions: ['signup'],
      help: <Text style={style.grey} onPress={() => setAction('forgotPassword')}>
        {i18n.t('Forgot password?')} <Text style={style.underline}>{i18n.t('Reset')}</Text></Text>,
    },
    signup: {
      title: i18n.t('appName'),
      subtitle: i18n.t('Whenever you spend or earn we make it easy for you to save and share'),
      help: <Text onPress={readTnC}>
        {i18n.t('By signing up you agree to our terms and conditions')}
      </Text>,
      actionTeaser: i18n.t('You are new here?'),
      action: i18n.t('Sign Up'),
      actions: ['login'],
    },
    forgotPassword: {
      subtitle: i18n.t('auth_forget_password_not_alone'),
      help: i18n.t('An email with a security code will be sent to you'),
      action: i18n.t('Forgot Password'),
      title: i18n.t('Forgot Password'),
      actions: ['login', 'signup'],
    },
    resetPassword: {
      help: i18n.t('auth_reset_password_help_text'),
      action: i18n.t('Reset Password'),
      title: i18n.t('Reset Password'),
      actions: ['login', 'signup'],
    },
    introduction: {
      help: i18n.t('A billion reasons why you should choose us'),
      action: i18n.t('Introduction'),
      title: i18n.t('Introduction'),
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
    });
    setGeneralError('');
  }, [action, showOnboarding, appLanguage]);

  const inputs = [
    [
      {
        placeholder: i18n.t('First Name'),
        label: i18n.t('First Name'),
        name: 'first_name',
        actions: ['signup'],
        rules: { required: true },
        // leftIcon:{name:"envelope", color:"black", type:"evilicon"}
      },
    ],
    [
      {
        placeholder: i18n.t('Last Name'),
        label: i18n.t('Last Name'),
        name: 'last_name',
        actions: ['signup'],
        rules: { required: true },
        // leftIcon:{name:"envelope", color:"black", type:"evilicon"}
      },
    ],
    [{
      placeholder: i18n.t('Enter Email'),
      label: i18n.t('Email'),
      name: 'email',
      autoCapitalize: 'none',
      actions: ['forgotPassword'],
      assistiveText: action === 'signup' ? i18n.t('Will be required to reset your password') : undefined,
      rules: { required: false },
      // leftIcon:{name:"envelope", color:"black", type:"evilicon"}
    }],
    {
      placeholder: i18n.t('Phone'),
      // label: i18n.t('Phone Number'),
      name: 'username',
      autoCapitalize: 'none',
      keyboardType: 'phone-pad',
      actions: ['login', 'signup'],
      rules: { required: true },
      // leftIcon:{name:"envelope", color:"black", type:"evilicon"}
    },
    [{
      placeholder: i18n.t('Enter OTP'),
      label: i18n.t('Security Code'),
      name: 'otp',
      autoCapitalize: 'none',
      keyboardType: 'decimal-pad',
      actions: ['resetPassword'],
      rules: { required: true },
      // leftIcon:{name:"envelope", color:"black", type:"evilicon"}
    }],
    [
      {
        placeholder: i18n.t('Enter Password'),
        label: i18n.t('Password'),
        name: 'password',
        autoCapitalize: 'none',
        togglePassword: true,
        isPassword: true,
        secureTextEntry: true,
        actions: ['login', 'signup', 'resetPassword'],
        rules: { required: true, minLength: 4 },
        customShowPasswordComponent: <Text>{i18n.t('Show')}</Text>,
        customHidePasswordComponent: <Text>{i18n.t('Hide')}</Text>,
        // leftIcon:{name:"key-outline", color:"black", type:"ionicon"}
      },
      {
        placeholder: i18n.t('Confirm'),
        label: i18n.t('Confirmation'),
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
    first_name: { required: { value: true, message: i18n.t('First name is required') } },
    last_name: { required: { value: true, message: i18n.t('Last name is required') } },
    email: {
      required: { value: true, message: i18n.t('Email is required') },
      pattern: {
        value:
          /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        message: i18n.t('Invalid Email Format'),
      },
    },
    username: {
      required: { value: true, message: i18n.t('Phone number is required') },
      minLength: { value: 10, message: i18n.t('Invalid phone number') },
    },
    password: {
      required: { value: true, message: i18n.t('Password is required') },
      minLength: { value: 4, message: i18n.t('Password must be at least 4 characters') },
    },
    password2: {
      required: { value: true, message: i18n.t('Confirm password') },
      validate: value => value === getValues('password') || i18n.t('Passwords do not match'),
    },
  };

  const getErrorMessage = key => {
    let error = errors[key];
    if (error) {
      return validation[key] && validation[key][error.type]?.message || error.type;
    } else {
      return null;
    }
  };

  const {
    getValues,
    handleSubmit,
    control,
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
        navigation.canGoBack() && navigation.goBack()
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
      let non_field_errors = error.data?.non_field_errors.join('; ');
      setGeneralError(error.message?.includes('Server') ? i18n.t('An account for this number already exists') : non_field_errors || JSON.stringify(error.data || error.message));
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
  function changeLanguage(langCode) {
    setAppLanguage(langCode);
    setTimeout(() => setIsLanguageModalVisible(false), 10);
  }

  return (
    <View style={style.root}>
      {showOnboarding ? <>
        <StatusBar backgroundColor={'transparent'} />
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
                source={require('src/assets/onboarding/slider1.png')}
                style={style.onboardImage}
                resizeMode="contain"
              />,
              title: i18n.t('Easy to save'),
              subtitle: i18n.t('Record your transaction data with no hustle'),
            },
            {
              backgroundColor: '#fff',
              image: <Image
                source={require('src/assets/onboarding/slider2.png')}
                style={style.onboardImage}
                resizeMode="contain"
              />,
              title: i18n.t('Easy to Scan'),
              subtitle: i18n.t('Scan and save product barcodes or supported official receipts'),
            },
            {
              backgroundColor: '#fff',
              image: <Image
                source={require('src/assets/onboarding/slider3.png')}
                style={style.onboardImage}
                resizeMode="contain"
              />,
              title: i18n.t('Easy to Share'),
              subtitle: i18n.t('Suitable for small and medium businesses where multiple people needs to track expenses'),
            },
          ]}
        />

        <View style={style.actionButtons}>
          <Button title={i18n.t('Sign Up').toUpperCase()}
            type={'solid'} onPress={onDoneTour}
            buttonStyle={style.loginSignupButton}
          />
          <View style={style.actionButtonDivider} />
          <Button
            title={i18n.t('Log In').toUpperCase()}
            type="outline"
            onPress={login}
            buttonStyle={style.loginSignupButton}
          />
          <TouchableOpacity onPress={() => setIsLanguageModalVisible(true)}>
            <Text style={style.changeLanguageText}>
              {i18n.t('Change Language')}
            </Text>
            <Icon name="chevron-down" type="entypo"
              size={14} color={colors.grey}
            />
          </TouchableOpacity>
        </View>
      </> :
        <KeyboardAvoidingView
          style={style.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <StatusBar backgroundColor={colors.primary} />
          <ScrollView>
            <View>
              {/* <FastImage source={logo} style={style.logo} /> */}
              {/* <Text style={style.appName}>{i18n.t('appName')}</Text> */}
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
                buttonStyle={style.submitButton}
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                title={(loading ? i18n.t('wait_loading') : actionName.toUpperCase())}
              />
              <View style={style.otherActionsContainer}>
                {otherActions
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
              <TouchableOpacity
                onPress={() => setIsLanguageModalVisible(true)}>
                <Text style={style.changeLanguageText}>
                  {i18n.t('Change Language')}
                </Text>
                <Icon name="chevron-down" type="entypo"
                  size={14} color={colors.grey}
                />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>}
      <Modal
        title={i18n.t('Language')}
        subtitle={i18n.t('Set Language')}
        modalHeight={0.4 * height}
        visible={isLanguageModalVisible}
        extraProps={{
          onClosed: () => setIsLanguageModalVisible(false),
        }}
      >
        {i18n.getAvailableLanguages().map((langCode, index) => <Button
          title={i18n.t(langCode)}
          onPress={() => changeLanguage(langCode)}
          key={index}
          type={langCode === appLanguage ? 'solid' : 'outline'}
          containerStyle={style.languageContainer}
        />)}
      </Modal>
    </View>
  );
}

const style = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex1: {
    flex: 1,
  },
  onboard: {
    padding: 10,
    width,
  },
  onboardImage: {
    height: 0.5 * width,
    width: 0.6 * width,
    padding: 0,
  },
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
  loginSignupButton: { borderWidth: 2.5, borderRadius: 6 },
  otherActionsContainer: {
    // flexDirection: 'row-reverse',
    // justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 0,
    paddingTop: 15,
    alignSelf: 'center',
    alignItems: 'center',
    width: '100%',
    // backgroundColor: colors.backgroundColor2,
  },
  divider: { paddingVertical: 10 },
  submitButton: {
    // backgroundColor: colors.primary,
    marginTop: 50,
    marginHorizontal: 10,
    minWidth: 100,
    height: 40,
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
    fontFamily: font.regular,
    // fontSize: 20,
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
  actionButtons: {
    marginTop: 40,
    marginBottom: 20,
    paddingHorizontal: 0.2 * width,
  },
  logo: { width: 40, height: 40, alignSelf: 'center' },
  appName: { textAlign: 'center', color: colors.primary, fontSize: 20, paddingBottom: 10 },
  grey: { color: colors.grey },
  subTitleStyles: { lineHeight: 28, fontFamily: font.light },
  titleStyles: { fontFamily: font.regular, fontWeight: '600' },
  languageContainer: { marginHorizontal: 20, marginVertical: 4 },
  changeLanguageText: { textAlign: 'center', marginTop: 40, color: colors.grey, fontSize: 14 },
});
