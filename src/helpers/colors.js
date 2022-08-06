// const primary="#C2D3AC";
// 51,108,138
const primary = 'rgb(89,175,165)'; //to hex 338A5D
// rgba(89,175,165, 0.4)
const getColorByName = name => {
  /*
    get colors when username is given
  */
  const getIndex = str => {
    let n = str && str.charCodeAt(0) - 95;
    if (!n) {
      n = 0;
    }
    if (n > 15) {
      n = n - 15;
    }
    return Math.min(15, n);
  };

  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[getIndex(name[i])] || letters[0];
  }
  return color;
};

export const colors = {
  primary: 'rgb(89,175,165)',
  primary0: 'rgba(89,175,165, 0)',
  primary1: 'rgba(89,175,165, 0.1)',
  primary2: 'rgba(89,175,165, 0.2)',
  primary3: 'rgba(89,175,165, 0.3)',
  primary4: 'rgba(89,175,165, 0.4)',
  primary5: 'rgba(89,175,165, 0.5)',
  primary6: 'rgba(89,175,165, 0.6)',
  primary7: 'rgba(89,175,165, 0.7)',
  primary8: 'rgba(89,175,165, 0.8)',
  primary9: 'rgba(89,175,165, 0.9)',
  getColorByName,
  headerText: 'white',
  withPrimary: 'white',

  underlayColor: 'rgb(235,235, 235)',
  black: 'black',
  white: 'white',
  grey: 'grey',
  link: 'rgb(89,175,165)',

  yellow: '#FEF1D1',
  yellow1: '#FDE3A1',
  yellow2: '#FCD576',
  yellow3: '#FBC748',
  yellow4: '#FAB91A',

  statusBar: primary,
  statusBarIOS: 'light-content',
  headerBackground: primary,
  backgroundColor: 'rgb(255,255,255)',
  backgroundColor2: 'rgb(245,245,245)',
  danger: 'rgb(255,0,90)',
  info: primary,
  success: primary, //"#4BB543",
  warning: '#8a5d33',
  heart: 'rgb(204, 61, 92)',
  disabledText: 'rgba(50,50,50, 0.4)',
};
