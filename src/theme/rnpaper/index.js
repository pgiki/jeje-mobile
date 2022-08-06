import { configureFonts } from 'react-native-paper';
// import { MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { colors, font } from '../../helpers';
const fontConfig = {
    web: {
        regular: {
            fontFamily: 'sans-serif',
            fontWeight: 'normal',
        },
        medium: {
            fontFamily: 'sans-serif-medium',
            fontWeight: 'normal',
        },
        light: {
            fontFamily: 'sans-serif-light',
            fontWeight: 'normal',
        },
        thin: {
            fontFamily: 'sans-serif-thin',
            fontWeight: 'normal',
        },
    },
    ios: {
        regular: {
            fontFamily: font.regular,
            fontWeight: 'normal',
        },
        medium: {
            fontFamily: font.medium,
            fontWeight: 'normal',
        },
        light: {
            fontFamily: font.light,
            fontWeight: 'normal',
        },
        thin: {
            fontFamily: font.light,
            fontWeight: 'normal',
        },
    },
    android: {
        regular: {
            fontFamily: font.regular,
            fontWeight: 'normal',
        },
        medium: {
            fontFamily: font.medium,
            fontWeight: 'normal',
        },
        light: {
            fontFamily: font.light,
            fontWeight: 'normal',
        },
        thin: {
            fontFamily: font.light,
            fontWeight: 'normal',
        },
    }
};

export const paperTheme = {
    fonts: configureFonts(fontConfig),
    colors: {
        primary: colors.primary,
        primaryContainer: colors.backgroundColor2,

        secondary: colors.black,
        secondaryContainer: colors.white,

        surface: 'white', //text
        onSurface: colors.black, //background
        onSurfaceVariant: 'rgba(10,10,10,0.8)',
        onSurfaceDisabled: colors.disabledText
    }
};