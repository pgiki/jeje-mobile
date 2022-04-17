import React, {useMemo} from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-elements';
import { useRecoilState } from 'recoil';
import { roleState } from 'src/atoms';
import {colors} from 'src/helpers'

export default function SelectRole(props) {
    const { buttons = ['Request Loan', 'Give Loan'], onPress} = props;
    const [userRole, setUserRole] = useRecoilState(roleState);

    function updateOption(role) {
        onPress?onPress(role):setUserRole(role);
    }
    return useMemo(()=>(
        <View style={style.container}>
        {buttons.map((role, index)=><Button
                key={index}
                title={role}
                // disabled={index===userRole}
                type={index===userRole?'solid':'outline'}
                buttonStyle={style.button}
                onPress={()=>updateOption(index)}
         />)}
    </View>
    ), [userRole])
}

const style = StyleSheet.create({
    container: {
        flexDirection:"row", 
        justifyContent:"space-evenly", 
        marginVertical:6,
        // backgroundColor:colors.backgroundColor2,
        paddingVertical:0
    }, 
    button:{
        paddingHorizontal:"10%", 
        paddingVertical:5,
        borderRadius:5,
        // borderBottomRightRadius:20,
    },
});
