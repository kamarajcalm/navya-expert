
import { getReferrer } from '../utils';

const defaultVars = {
  'color': '#893487',
  'color-rgb': '137, 52, 135',
  'color-contrast': '#ffffff',
  'color-contrast-rgb': '255, 255, 255',
  'color-shade': '#9e4f8c',
  'color-tint': '#bc6ba9',
  'color-dark': '#515151',
  'font-family': "Gotham Rounded SSm A, Gotham Rounded SSm B",
  // 'font-family': "Recoleta-Medium",
  // 'font-family': "Proxima Nova",
  // 'font-family': "Sofia Pro Regular",
  // 'font-family': "Sofia Pro Medium",
  // 'h1-font-family': 'Recoleta-Medium',
  // 'h1-font-family': 'Sofia Pro Medium',
  // 'h1-font-family': 'Proxima Nova',
  'h1-font-family': "Gotham Rounded SSm A, Gotham Rounded SSm B",
  'login-background-color': '#fff',
  'text-color': '#515151',
  'priority':'#dda534',
  'pending':'#72c8cd',
  'overdue':'#b52d24',
  'done':'#893487',
  "top-navbar":'#893487',
  "bottom-navbar":'#893487'
};

export const avatarStyles = {
  'tmc': { ...defaultVars },
  'navya': { ...defaultVars },
  'ncg': { ...defaultVars },
  'apollo': {
    'color': '#007c9d',
    'color-rgb': '0, 124, 157',
    'color-contrast': '#ffffff',
    'color-contrast-rgb': '255, 255, 255',
    'color-shade': '#015d76',
    'color-tint': '#3a93ab',
    'color-dark': '#515151',
    'font-family': "Gotham Rounded SSm A, Gotham Rounded SSm B",
    'h1-font-family': 'Gotham Rounded SSm A, Gotham Rounded SSm B',
    'login-background-color': '#fff',
    'text-color': '#515151',
    'priority':'#dda534',
    'pending':'#72c8cd',
    'overdue':'#b52d24',
    'done':'#007c9d',
    "top-navbar":'#007c9d',
    "bottom-navbar":'#007c9d'
  },
  'mskcc': {
    'color': '#0968c3',
    'color-rgb': '9, 104, 195',
    'color-contrast': '#ffffff',
    'color-contrast-rgb': '255, 255, 255',
    'color-shade': '#064785',
    'color-tint': '#1c73ca',
    'color-dark': '#515151',
    'font-family': "HCo Gotham SSm,Helvetica Neueu,helvetica,arial,sans-serif",
    'h1-font-family': 'HCo Gotham SSm,Helvetica Neueu,helvetica,arial,sans-serif',
    'login-background-color': '#0968c3',
    'text-color': '#000',
    'priority':'#dda534',
    'pending':'#72c8cd',
    'overdue':'#b52d24',
    'done':'#0968c3',
    "top-navbar":'#0968c3',
    "bottom-navbar":'#0968c3'
  },
  'pm': {
    'color': '#006cb6',
    'color-rgb': '0, 108, 190',
    'color-contrast': '#ffffff',
    'color-contrast-rgb': '255, 255, 255',
    'color-shade': '#4e75fb',
    'color-tint': '#1c73ca',
    'color-dark': '#515151',
    'font-family': "HCo Gotham SSm,Helvetica Neueu,helvetica,arial,sans-serif",
    'h1-font-family': 'HCo Gotham SSm,Helvetica Neueu,helvetica,arial,sans-serif',
    'login-background-color': '#006cb6',
    'text-color': '#000',
    'priority':'#dda534',
    'pending':'#72c8cd',
    'overdue':'#b52d24',
    'done':'#006cb6',
    "top-navbar":'#006cb6',
    "bottom-navbar":'#006cb6'
  },
  'accesshope': {
    'color': '#109fdc',
    'color-rgb': '0, 108, 190',
    'color-contrast': '#ffffff',
    'color-contrast-rgb': '255, 255, 255',
    'color-shade': '#7817D6',
    'color-tint': '#1c73ca',
    'color-dark': '#515151',
    'font-family': "HCo Gotham SSm,Helvetica Neueu,helvetica,arial,sans-serif",
    'h1-font-family': 'HCo Gotham SSm,Helvetica Neueu,helvetica,arial,sans-serif',
    'login-background-color': '#4e75fb',
    'text-color': '#000',
    'priority':'#EC008C',
    'pending':'#4CD76F',
    'overdue':'#FFBF3F',
    'done':'#0072CE',
    "top-navbar":'#7817D6',
    "bottom-navbar":'#11a9e8'
  }
}

export const setAvatarStyles = (referrer) => {
  const style = avatarStyles[referrer] || defaultVars;
  setAvtStyles(style, null);
}

export const getAvatarStyles = () => {
  const referrer = getReferrer();
  return avatarStyles[referrer] || defaultVars;
}

function setAvtStyles(style, subProperty) {

  const rootStyle = document.documentElement.style;

  for (let styleProp in style ) {
    if (typeof style[styleProp] === 'object') {
      setAvtStyles(style[styleProp], styleProp);
    } else {
      let stylePropDisplay = subProperty ? `${subProperty}-${styleProp}` : styleProp;
      rootStyle.setProperty(`--ion-avatar-${stylePropDisplay}`, style[styleProp]);
    }
  }
}
