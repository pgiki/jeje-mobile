import React from "react";
import { withBadge, Icon} from "react-native-elements";
export const BadgedIcon =(props)=> {
    const CustomIcon = props.value?withBadge(props.value)(Icon):Icon
    return <CustomIcon {...props} />
};