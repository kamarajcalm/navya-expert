
import { Plugins } from '@capacitor/core';
import globalVars from './globalVars';
import api from './api/endpoints';
import tokenManager from './api/tokenManager';
import moment from 'moment';
import {
  SURVEY_DETAILS_TRACKER, SURVEY_COMMENTS_TRACKER,
  SURVEY_ATTACHMENT_TRACKER
} from './common/analytics';
import { strictEqual } from 'assert';

// import { isPlatform, getPlatforms } from '@ionic/react';

let deviceInfo;
let nonAndroidPlatforms = ['ios', 'web'];
// let platforms = getPlatforms();

Plugins.Device.getInfo().then(function(info) {
  deviceInfo = {...info};
  nonAndroidPlatforms = ['ios', 'web'];
}).catch(function() {
  console.log('errored !');
});

window.setTrackerTimers = (detail, comment, attachment) => {
  const obj = { detail, comment, attachment }
  localStorage.setItem('trackerTimers', JSON.stringify(obj));
}

window.clearTrackerTimers = (detail, comment, attachment) => {
  localStorage.removeItem('trackerTimers');
}

export const isSmallScreen = () => {
  return (/iPhone|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(navigator.userAgent) || screen.availWidth < 576 || isMobileApp())
};

export const isWeb = () => {
  return window.Capacitor.platform === "web";
};

export const isMobileApp = () => {
  return window.Capacitor.platform !== "web"
};

export const useCookie = () => {
  if (isWeb()){
    const environment = getEnvironment()
    if (environment != "local"){
      return true
    }
  }
  return false;
}

export const displayDashboardTabOption = () => {
  // console.log('hasDashboardAccess() : ',hasDashboardAccess());
  // console.log('isSmallScreen() : ',isSmallScreen());
  if (isSmallScreen()) {
    return true;
  } else {
    return !hasDashboardAccess();
  }
}

export const getEnvironment = () => {

    var environment = localStorage.getItem('env') || "prod";

    if (isWeb()) {
      const hostname = window.location.hostname;
      if (hostname.indexOf('localhost') > -1 || hostname.indexOf('0.0.0.0') > -1) {
        environment = "local";
      } else if (hostname.indexOf('bestopinions') > -1) {
        environment = "dev";
      } else if (hostname.indexOf('preproduction') > -1) {
        environment = "preprod";
      } else if (hostname.indexOf('navya.care') > -1) {
        environment = "prod";
      }
    }

    return environment;
}

export const getWebReferrer = () => {
  const referrerList = ['apollo', 'mskcc', 'pm', 'accesshope'];
  let referrer = 'tmc';
  for(let c = 0; c <= referrerList.length; c++) {
    if (window.location.hostname.indexOf(referrerList[c]) > -1) {
      referrer = referrerList[c];
      break;
    }
  }
  if (window.location.href.indexOf('bestopinion.net') > -1) {
    referrer = 'apollo';
  }
  if (window.location.href.indexOf('ah') > -1) {
    referrer = 'accesshope';
  }

  return referrer;
}

export const getLoggedInUserId = () => {
  const TokenManager = new tokenManager()
  const userID = TokenManager.getExpertId();
  return (userID || null);
}

export const isLoggedIn = () => {
  const loggedInUserID = getLoggedInUserId();
  return loggedInUserID;
}

export const isApollo = () => {
  return window.location.hostname.indexOf('apollo') > -1;
}

export const isAndroid = () => {
  const platform = deviceInfo.platform;
  return nonAndroidPlatforms.indexOf(deviceInfo.platform) === -1;
}

export const getQueryVariable = variable => {
    // const query = window.location.search.substring(1);
    const query = (window.location.search) ? window.location.search.substring(1) : globalVars.getURILocationSearch();
    if (!query) return null;
    const vars = query.split('&');
    for (let i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      if (decodeURIComponent(pair[0]) == variable) {
        return decodeURIComponent(pair[1]);
      }
    }
    return null;
}

export const isExpert = () => {
  return !!(localStorage.getItem('is_expert') * 1);
}

export const isOrgAdmin = () => {
  return !!(localStorage.getItem('is_org_admin') * 1);
}


export const getRedirectURLOnAppLoad = () => {

  let loggedIn = isLoggedIn();

  let alphaToken = getQueryVariable('token');
  let alphaRefreshToken = getQueryVariable('refresh_token');
  let alphaeosid = getQueryVariable('eosid');
  let alphamedicalcaseid = getQueryVariable('medicalcaseid');

  if (isAlphaPreviewParamsInURL()) {
    if (loggedIn) {
      return `/user/alphasurveypreview/${alphamedicalcaseid}/${alphaeosid}`
    } else {
      return `/login?token=${alphaToken}&refresh_token=${alphaRefreshToken}&medicalcaseid=${alphamedicalcaseid}&eosid=${alphaeosid}`;
    }
  }

  let surveyToken = getQueryVariable('survey_token');
  let surveyID = getQueryVariable('survey_id');
  let org = getQueryVariable('org');
  let inviteType = getQueryVariable('invite_type');

  if(surveyID) {

    let referrer = getReferrer()

    let searchParams = `survey_id=${surveyID}&org=${org}`;

    if(surveyToken) {
      searchParams = searchParams + `&survey_token=${surveyToken}`;
    }

    if(inviteType) {
      searchParams = searchParams + `&invite_type=${inviteType}`;
    }

    if(loggedIn) {
      if (hasSurveyAccess()) {
        if (referrer == "accesshope" && inviteType !== 'qc'){ // not using isAccessHope() here since it would lead to import loop I believe
          return '/user/surveys';
        }
        return (isMobileApp() ? `/user/surveys/${surveyID}?${searchParams}` : `/user/surveys/${surveyID}`);
      } else if (hasOnlyDashboardAccess()) {
        return '/user/dashboard';
      } else {
        new tokenManager().clearToken();
      }
    }
    return `/login?${searchParams}`;
  }



  if(loggedIn) {

    if (hasSurveyAccess()) {
        return '/user/home';
    } else if (hasOnlyDashboardAccess()) {
        return '/user/dashboard';
    } else if (hasNoSurveyAndNoDashboardAccess()) {
      return '/user/accesserror';
    }

  } else {
    return isMobileApp() && localStorage.getItem('referrer') === null ? '/selector' :  '/login';
  }
}

export const isAlphaTokenInURL = () => {
  return getQueryVariable('token') !== null;
  // return true;
}

export const isAlphaPreviewParamsInURL = () => {
  return (!!getQueryVariable('eosid') && !!getQueryVariable('medicalcaseid') && !!getQueryVariable('refresh_token') && !!getQueryVariable('token'));
}

export const isSurveyTokenInURL = () => {
  // return getQueryVariable('survey_token') !== null && localStorage.getItem('loggedOut') !== "true";
  return getQueryVariable('survey_token') !== null;
  // return true;
}

export const isSurveyIdInURL = () => {
  return getQueryVariable('survey_id') !== null;
}

export const isDebug = () => {
  return !!localStorage.getItem('is_in_debug_mode');
}

export const getReferrer = () => {
  // return "accesshope"
  let typeParams = getQueryVariable('type');
  let org = getQueryVariable('org');
  let referrerParams = getQueryVariable('referrer');
  org = org ? org.toLowerCase() : null;
  let orgName = typeParams || org;
  // setting of expertorg localStorage when type / org is available in url
  // org is available from survey email
  // type is available from selector screen
  // the below condition is only for mobile-app
  if (isMobileApp() && orgName) {
    localStorage.setItem('expertorg', orgName);
  }
  let referrer = orgName ? orgName : localStorage.getItem('referrer');
  referrer = isWeb() && !isDebug() ? getWebReferrer() : referrer;
  referrer = isApollo() ? 'apollo' : referrer;
  referrer = (referrer === 'cankids') || (referrer === 'ncg') || (referrer === 'poem') || (referrer === 'navya') ? 'tmc' : referrer;
  // debugger;
  return (referrer || null);
}

export const getAlertTitle = () => {
  // const referrer = getReferrer();

  let alertTitle = '';
  // if(referrer) {
  //   if(referrer == 'tmc') {
  //     alertTitle = referrer.toUpperCase() + ' NCG Navya';
  //   } else if(referrer == 'mskcc') {
  //     alertTitle = referrer.toUpperCase() + ' Navya';
  //   } else if(referrer == 'apollo') {
  //     alertTitle = referrer.charAt(0).toUpperCase() + referrer.slice(1) + ' Cancer Opinion';
  //   }
  // }

  return alertTitle;
}

export const showUpdateInfoPopup = () => {
  if (sessionStorage.getItem('force_update')) {
    window.dispatchEvent(new CustomEvent('customLoad'));
  }
}

const getUpdateInfo = async () => {
    const info = await Plugins.Device.getInfo();
    const {
      platform, appBuild: version_code, appVersion: version, uuid: uniquekey
    } = info;
    let params = {
      platform, version_code, version, uniquekey: localStorage.getItem('deviceID') || uniquekey
    }
    if (isLoggedIn()) {
      params = Object.assign({}, params, {expertid: localStorage.getItem('expertid')});
    }
    const updateInfoResponse = await api.updateInfo(params);
    if (updateInfoResponse && updateInfoResponse.force_update) {
      sessionStorage.setItem('force_update', 1);
      setTimeout(() => {
        showUpdateInfoPopup();
      }, 100);
    }
}

export const callUpdateInfo = async () => {
  // if (isMobileApp() && !!!sessionStorage.getItem("updateInfoCalled")) {
  if (!!!sessionStorage.getItem("updateInfoCalled")) {
  // if (isMobileApp() && !!!sessionStorage.getItem("force_update")) {
    sessionStorage.setItem("updateInfoCalled", 1);
    await getUpdateInfo();
  }
}

export const setSurveySource = (source) => {
  sessionStorage.setItem('survey_detail_source', source);
}

export const getSurveySource = () => {
  return sessionStorage.getItem('survey_detail_source');
}

export const deleteSurveySource = () => {
  sessionStorage.removeItem('survey_detail_source');
}

export const setTrackingSurvey = (survey_id) => {
  sessionStorage.setItem('last_tracked_survey', survey_id);
}

export const getTrackingSurvey = () => {
  return sessionStorage.getItem('last_tracked_survey');
}

export const deleteTrackingSurvey = () => {
  sessionStorage.removeItem('last_tracked_survey');
}

export const addZeroPrefix = value => {
  return value = value < 10 ? `0${value}` : value;
}

export const trackingObjMap = () => ({
  'comment': SURVEY_COMMENTS_TRACKER,
  'detail': SURVEY_DETAILS_TRACKER,
  'attachment': SURVEY_ATTACHMENT_TRACKER
})

export const isPrevTrackingExists = (prevTrackerValues, type) => {

  const obj = trackingObjMap();
  return prevTrackerValues[type].trackType === obj[type].START;
}

export const isCurntTrackingExists = (currentTrackType, type) => {

  const obj = trackingObjMap();
  return currentTrackType === obj[type].START;
}


export const getDateSuffix = date => {
  let dateStr = date.toString();
  let lastChar = dateStr[dateStr.length - 1] * 1;
  if (date > 10 && date <= 19) {
    date += 'th';
  } else if (lastChar === 1) {
    date+='st';
  } else if (lastChar === 2) {
    date+='nd';
  } else if (lastChar === 3) {
    date+='rd';
  } else {
    date+='th';
  }
  return date;
}

export const isSurveyDetailsPage = () => {
  const surveyPat = /(\/user\/surveys\/)\d+/i;
  return surveyPat.test(window.location.pathname.toLowerCase());
}

export const getNumberOfDaysFromToday = localDateTime => {
  const localObj = new Date(localDateTime).getTime();
  const currentDateObj = new Date().getTime();
  let hours = (currentDateObj - localObj) / (1000 * 3600);

  let days =  Math.floor(hours / 24);
  let value = (days > 1 ? days > 99 ? '99+ Days' : days+' Days' : days+' Day');
  if (days <= 0) {
    value = Math.round(hours);
    value = value > 1 ? value + ' hours' : value === 1 ? value + ' hour' : '';

  }
  return value;
}

export const getLocalDateTime = utcDateTimeStr => {
  if (utcDateTimeStr.trim() === '') return '';
  const dUTC = new Date(`${utcDateTimeStr.trim().replace(' ','T')}.000Z`);
  const fullYear = dUTC.getFullYear();
  const month = addZeroPrefix(dUTC.getMonth() + 1);
  const date = addZeroPrefix(dUTC.getDate());
  const hours = addZeroPrefix(dUTC.getHours());
  const minutes = addZeroPrefix(dUTC.getMinutes());
  return `${fullYear}-${month}-${date} ${hours}:${minutes}`;
}

export const getLocalDateForDashboard = utcDateTimeStr => {
  if (utcDateTimeStr.trim() === '') return '';
  const dUTC = new Date(`${utcDateTimeStr.trim().replace(' ','T')}.000Z`);
  const month = dUTC.toLocaleDateString(undefined, { month: 'short' });
  const date = dUTC.toLocaleDateString(undefined, { day: 'numeric' });
  const day = dUTC.toLocaleDateString(undefined, { weekday: 'short' });
  return month + ' ' + date + ', ' + day;
}

export const getLocalTimeForDashboard = utcDateTimeStr => {
  if (utcDateTimeStr.trim() === '') return '';
  const dUTC = new Date(`${utcDateTimeStr.trim().replace(' ','T')}.000Z`);
  let hours = addZeroPrefix(dUTC.getHours());
  const minutes = addZeroPrefix(dUTC.getMinutes());
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return hours + ':' + minutes + ' ' + ampm;
}

export const getUTCDateTimeOLD = dateTimeStr => {
  const dt = dateTimeStr.trim();
  if (dt === '') return '';
  // new Date(2020-03-23T09:06:00) gives IST as 5hrs 30 minutes later
  const d = new Date(dt.replace(' ','T') + ':00.000Z');
  const dateTimeStrInMillliSecs = d.getTime();
  // getting timezone offset from current timezone
  const offsetInMilliSecs = d.getTimezoneOffset() * 2 * 60 * 1000;
  const utcInMilliSecs = dateTimeStrInMillliSecs + offsetInMilliSecs;
  const utcDateStr = new Date(utcInMilliSecs);
  const utcFullYear = utcDateStr.getFullYear();
  const utcMonth = addZeroPrefix(utcDateStr.getMonth() + 1);
  const utcDate = addZeroPrefix(utcDateStr.getDate());
  const utcHours = addZeroPrefix(utcDateStr.getHours());
  const utcMinutes = addZeroPrefix(utcDateStr.getMinutes());
  return `${utcFullYear}-${utcMonth}-${utcDate} ${utcHours}:${utcMinutes}`;
}

export const getUTCDateTime = dateTimeStr => {
  const dt = dateTimeStr.trim();
  if (dt === '') return '';
  const mtUTC = moment(dt + ':00', 'YYYY-MM-DD HH:mm:ss').utc();
  return `${mtUTC.get('year')}-${mtUTC.get('month') + 1}-${mtUTC.get('date')} ${mtUTC.get('hours')}:${mtUTC.get('minutes')}`;
}

 export const getTabSubTabData = (params)  => {
   const {
     stubArray, cbFn=()=>{}, parentTabIndex=null, isSubTab=0,
   } = params;
   const elems = stubArray.map((item, currentTabIndex) => {
     if (item.subTabs) {
       return getTabSubTabData({
        stubArray: item.subTabs,
        parentTabIndex: currentTabIndex,
        isSubTab: 1, cbFn
      });
     } else {
       const pIndex = parentTabIndex || currentTabIndex;
       const cIndex = isSubTab ? currentTabIndex : 0;
       return cbFn({pIndex, cIndex, isSubTab, item});
     }
   });
   return elems;
 }

 export const getActualSurveyType = () => {
  const surveysTab = globalVars.getSurveysTab();
  if(!surveysTab) {
    return null;
  }
  return getSurveyType();
 }

 export const getCommnSvyDetTrckngParams = () => {
   const params = { source: getSurveySource() || 'direct' };
   if (params.source === 'direct') {
     params.survey_state = getActualSurveyType();
   };
   return params;
 }

export const getSurveyType = () => {
  const surveysTab = globalVars.getSurveysTab() || globalVars.getDefaultSurveysTab();

  const {
    currentTabIndex, parentTabIndex, isSubTab
  } = surveysTab;

  console.log('getSurveysTab', surveysTab);

  const sTConstants = globalVars.getSurveyTabConstants();

  return (
    isSubTab ? sTConstants[parentTabIndex][1][currentTabIndex].toLowerCase() :
    sTConstants[parentTabIndex][0].toLowerCase()
  );
}

export const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

export const isMSKCCEmail = (email) => {
  const array = email.split('@');
  if(array.length  > 1) {
    if(array[1].toLowerCase().indexOf('mskcc') > -1 || array[1].toLowerCase().indexOf('navya') > -1) {
      return true;
    }
  }

  return false;
}

export const isPMEmail = (email) => {
  const array = email.split('@');
  if(array.length  > 1) {
    if(array[1].toLowerCase().indexOf('uhn') > -1 || array[1].toLowerCase().indexOf('pm') > -1 || array[1].toLowerCase().indexOf('navya') > -1) {
      return true;
    }
  }

  return false;
}

export const isAccessHopeEmail = (email) => {
  const array = email.split('@');
  if(array.length  > 1) {
    if(array[1].toLowerCase().indexOf('accesshope') > -1 || array[1].toLowerCase().indexOf('harvard') > -1 || array[1].toLowerCase().indexOf('emory') > -1 || array[1].toLowerCase().indexOf('coh') > -1 || array[1].toLowerCase().indexOf('nm') > -1 || array[1].toLowerCase().indexOf('northwestern') > -1 || array[1].toLowerCase().indexOf('navya') > -1) {
      return true;
    }
  }

  return false;
}

export const hasSurveyAccess = () => {

  const hasSurveyAccessFlag = localStorage.getItem('has_survey_access');

  if (hasSurveyAccessFlag == null) return isExpert();

  return !!(localStorage.getItem('has_survey_access') * 1);

}

export const hasDashboardAccess = () => {

  const hasDashboardAccessFlag = localStorage.getItem('has_dashboard_access');

  if (hasDashboardAccessFlag == null) return isOrgAdmin();

  return !!(localStorage.getItem('has_dashboard_access') * 1);

}

export const hasOnlySurveyAccess = () => {
  return hasSurveyAccess() && !hasDashboardAccess()
}

export const hasOnlyDashboardAccess = () => {
  return !hasSurveyAccess() && hasDashboardAccess()
}

export const hasSurveyAndDashboardAccess = () => {
  return hasSurveyAccess() && hasDashboardAccess()
}

export const hasNoSurveyAndNoDashboardAccess = () => {
  return !hasSurveyAccess() && !hasDashboardAccess()
}

export const removeSlashInComments=(comments)=>{
  console.log('comments',comments)
  if(comments)
  return comments.replaceAll("\\", "")
  if(comments==='')
  return '';
}

export const isUserHasQcAccess=()=>{
  // return false
  let qcAccess=localStorage.getItem('has_qc_access')
  if(qcAccess==='1')
  return true
  else
  return false
}
