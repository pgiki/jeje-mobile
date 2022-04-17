/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView, Platform,
  View, KeyboardAvoidingView,
} from 'react-native';
import { Text, Icon, Button } from 'react-native-elements';
import Input from 'src/components/Input';
import {
  utils,
  width,
  requests,
  colors,
  font,
  url,
} from 'src/helpers';
import { useForm, Controller } from 'react-hook-form';

export default function ProfileEdit(props) {
  const {
    navigation,
    route: { params = {} },
  } = props;
  const loggedUser = utils.getUser();
  const itemType = 'User';
  const [action, setAction] = useState(params?.action || 'change');
  const [generalError, setGeneralError] = useState('');
  const [item, setItem] = useState(loggedUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getItem(false);
  }, []);

  const actionMap = {
    change: {
      action: 'Update Profile',
      help: 'Click below to save the updated data',
      actions: ['forgotPassword', 'create'],
    },
    create: {
      help: 'A portfolio is an easy way to you to manage your funds when you share with friends',
      action: 'Create Profile',
      actions: ['change'],
    },
  };
  const actionName = actionMap[action].action;
  const helpText = actionMap[action].help;

  useEffect(() => {
    navigation.setOptions({
      title: actionName,
    });
    setGeneralError('');
  }, [actionName]);

  const inputs = [
    [
      {
        placeholder: 'Username',
        label: 'Username',
        name: 'username',
        editable: false,
        actions: ['create', 'change'],
        rules: { required: true, message: 'The name is important' },
        // leftIcon:{name:"envelope", color:"black", type:"evilicon"}
      },
    ],
    [
      {
        placeholder: 'First Name',
        label: 'First Name',
        name: 'first_name',

        actions: ['create', 'change'],
        rules: { required: true, message: 'The name is important' },
        // leftIcon:{name:"envelope", color:"black", type:"evilicon"}
      },
    ],
    [
      {
        placeholder: 'Last Name',
        label: 'Last Name',
        name: 'last_name',
        actions: ['create', 'change'],
        rules: { required: false },
        // leftIcon:{name:"envelope", color:"black", type:"evilicon"}
      },
    ],
    [
      {
        placeholder: 'Enter Email',
        label: 'Email',
        name: 'email',
        assistiveText: 'Required to reset password and other communications',
        actions: ['create', 'change'],
        rules: { required: false },
        // leftIcon:{name:"envelope", color:"black", type:"evilicon"}
      },
    ],
    [
      {
        placeholder: 'Select Currency',
        label: 'Currency',
        name: 'currency',
        keyboardType: 'currency-options',
        multiline: true,
        actions: ['create', 'change'],
        rules: { required: false },
        // leftIcon:{name:"envelope", color:"black", type:"evilicon"}
      },
    ],
  ];

  const validation = {};

  const {
    register,
    setValue,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    mode: 'all',
    criteriaMode: 'firstError',
    shouldFocusError: true,
    shouldUnregister: true,
    defaultValues: item || {},
  }, validation);

  const getItem = async (can_navigate = true) => {
    /*
      set token, get user profile, save and navigate away
    */
    if (!params.itemId) { return; }

    const res = await requests.get(
      `${url.getURL(itemType, { type: 'detail', item: { id: params.itemId } })}`,
    );

    setItem(res);
    setAction('change');

    if (can_navigate) {
      const { nextPage, nextParams = {} } = params;
      if (nextPage) {
        navigation.navigate(nextPage, nextParams);
      } else {
        navigation.goBack();
      }
    }

  };

  useEffect(() => {
    reset(item);
  }, [item]);

  const onSubmit = async data => {
    setLoading(true);
    const onError = error => {
      setGeneralError(JSON.stringify(error.data?.detail || error.data || error.message));
    };
    try {
      // create normal object here
      const req = !item?.id ? requests.post(url.getURL(itemType, { type: 'add' }), data)
        : requests.patch(
          url.getURL(itemType, { type: 'edit', item }),
          data
        );
      const res = await req;
      setItem(res);
      utils.setUser({ ...loggedUser, ...res });
      setLoading(false);
      navigation.navigate('Home');
    } catch (error) {
      setLoading(false);
      onError(error);
    }

  };

  const getErrorMessage = key => {
    let error = errors[key];
    if (error) {
      const msg = error.message || error.type;
      return msg === 'required' ? 'This field is required' : msg;
    } else {
      return null;
    }
  };
  /*{
      "email": {
      "type": "required",
      "message": "",
      "ref": {
        "name": "email"
      }
  }*/

  return (
    <KeyboardAvoidingView style={style.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView>
        <View style={style.container}>
          {inputs
            .filter(i => Array.isArray(i) || i.actions?.includes(action))
            .map((input, index) => (
              <View key={`i-${index}`}>
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
                          <Input
                            containerStyle={
                              input.filter(i => i.actions?.includes(action))
                                .length > 1
                                ? style.horizontalInput
                                : {}
                            }
                            {..._input}
                            onBlur={onBlur}
                            onChangeText={_value => onChange(_value)}
                            // onChange={onChange}
                            value={value?.toString()}
                            errorMessage={getErrorMessage(_input.name)}
                          />
                        )}
                        name={_input.name}
                        rules={_input.rules || {}}
                      />
                    ))}
                </View>
              </View>
            ))}
          {!!generalError && (
            <Text style={style.errorText}>{generalError}</Text>
          )}

          <Text style={style.helpText}>{helpText}</Text>
          <View style={style.actionNameContainer}>
            <Text style={style.actionNameText}>{actionName}</Text>
            <Button
              title="Submit"
              buttonStyle={style.arrowRightContainer}
              disabled={loading}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const style = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    // paddingHorizontal:10,
    paddingTop: 10,
  },
  container: {
    paddingHorizontal: 10,
    paddingTop: 20,
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
    fontSize: 20,
    textDecorationLine: 'underline',
  },
  otherActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 20,
    paddingTop: 20,
    backgroundColor: colors.backgroundColor2,
  },
  divider: { paddingVertical: 10 },

  arrowRightIcon: { padding: 10, alignSelf: 'center' },
  arrowRightContainer: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  actionNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingTop: 15,
  },
  actionNameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 20,
  },
  helpText: {
    paddingTop: 15,
    paddingLeft: 10,
  },
  errorText: {
    paddingTop: 15,
    paddingLeft: 10,
    color: colors.danger,
  },
  horizontalInput: { width: 0.47 * width },
});
