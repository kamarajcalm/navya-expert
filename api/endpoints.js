import TokenManager from './tokenManager';
import requests from './requests';
import { isMobileApp, getSurveyType, getQueryVariable, getReferrer, useCookie } from '../utils';

const tokenManager = new TokenManager();

const DEFAULT_EXTENSION = 'webapi/'
const EOS_EXTENSION = 'eos/'

const preLoggedInRequest = async(api_extension, values={}, first_extension=DEFAULT_EXTENSION) => {
  api_extension = first_extension + api_extension
  try {
    const data = await requests.post(api_extension, values, {});
    return data;
  }
  catch(ex) {
    return getErrorResponse(ex.response);
  }
}

const getErrorResponse = (response) => {
  let error = null;
  console.log('api error',response);
  if(response) {
    if(response.body) {
      error = response.body;
    } else {
      error = {
          "error": "Something went wrong. Please try again after few minutes.",
          "client_error": true // required to differentiate between error key from client and server
      };
    }
    error['status'] = response.statusCode;
  }
  console.log(error);
  return error;
}

// Login and Forgot Password

const baseauth = async (values) => {
    let endpoint_url = 'baseauth';
    if (useCookie()){
      endpoint_url = 'expertappbaseauth'
    }
    const data = await preLoggedInRequest(endpoint_url, values);
    return data;
}

const registerDevice = async (values) => {
    const data = await loggedInRequest('registerDevice', values);
    return data;
}

const authenticate = async (values) => {
    const data = await preLoggedInRequest('authenticate', values);
    return data;
}

const forgotPassword = async (values) => {
    const data = await preLoggedInRequest('forgotPassword', values);
    return data;
}

const loggedInRequest = async(api_extension, values={}, first_extension=DEFAULT_EXTENSION) => {
  api_extension = first_extension + api_extension
  try {
    const data = await requests.post(api_extension, values, {}, tokenManager.defaultFormHandler);
    return data;
  }
  catch(ex) {
    return getErrorResponse(ex.response);
  }
}

const updateInfo = async (values) => {
    const data = await preLoggedInRequest('updateInfo', values);
    return data;
}

const validateToken = async (values) => {
    const data = await loggedInRequest('validatetoken', values);
    return data;
}

// Home
const dashboard = async () => {
    const data = await loggedInRequest('dashboard');
    return data;
}
const getannouncements = async () => {
    const data = await loggedInRequest('getannouncements');
    return data;
}

// Performance
const experttotal = async () => {
    const data = await loggedInRequest('experttotal');
    return data;
}
const experttotalinorg = async () => {
    const data = await loggedInRequest('experttotalinorg');
    return data;
}
const expertlastxdays = async (ndays) => {
    const data = await loggedInRequest('expertlastxdays', {"ndays": ndays});
    return data;
}
const experttotalinorglastxdays = async (ndays) => {
    const data = await loggedInRequest('experttotalinorglastxdays', {"ndays": ndays});
    return data;
}
const expertdmgperformance = async (ndays) => {
    const data = await loggedInRequest('expertdmgperformance', {"ndays": ndays});
    return data;
}
const orgdmgperformance = async (ndays) => {
    const data = await loggedInRequest('orgdmgperformance', {"ndays": ndays});
    return data;
}

const expertspecialityxdays = async (ndays) => {
  const data = await loggedInRequest('expertspecialityxdays', {"ndays": ndays});
  return data;
}

const expertspeciality = async () => {
    const data = await loggedInRequest('expertspeciality');
    return data;
}

const getExpertTotal = async (days) => {
  const data = days ? await expertlastxdays(days) : await experttotal();
  return data;
}

const getExpertTotalInOrg = async (days) => {
  const data = days ? await experttotalinorglastxdays(days) : await experttotalinorg();
  return data;
}

const getExpertSpecialty = async (days) => {
  const data = days ? await expertspecialityxdays(days) : await expertspeciality();
  return data;
}

const getDMG = async (days) => {
  days = days || 3650;
  const data = await expertdmgperformance(days);
  return data;
}

const getDMGOrg = async (days) => {
  days = days || 3650;
  const data = await orgdmgperformance(days);
  return data;
}

// Surveys
const eosExpertviewp = async (page_num, status, searchKey = '', is_in_debug_mode=false) => {
    let params = { page_num, status, 'SearchKey': searchKey};
    params = is_in_debug_mode ? { ...params, is_in_debug_mode } : { ...params };
    const data = await loggedInRequest('eosExpertviewp', params);
    return data;
}

const eosExpertInvitedview = async (page_num, status, searchKey = '', is_in_debug_mode=false) => {
  let params = { page_num, status, 'SearchKey': searchKey};
  params = is_in_debug_mode ? { ...params, is_in_debug_mode } : { ...params };
  const data = await loggedInRequest('eosExpertInvitedview', params);
  return data;
}

const eosExpertReviewSubmissionView = async (page_num, status, searchKey = '', is_in_debug_mode=false) => {
  let params = { page_num, status, 'SearchKey': searchKey};
  params = is_in_debug_mode ? { ...params, is_in_debug_mode } : { ...params };
  const data = await loggedInRequest('eosExpertReviewSubmissionView', params);
  return data;
}

const eosExpertview = async (page_num, status, searchKey = '', is_in_debug_mode=false) => {
    let params = { page_num, status, 'SearchKey': searchKey};
    params = is_in_debug_mode ? { ...params, is_in_debug_mode } : { ...params };
    const data = await loggedInRequest('eosExpertview', params);
    return data;
}

const eosExpertQcview = async (page_num, status, searchKey = '', is_in_debug_mode=false) => {
  let params = { page_num, status, 'SearchKey': searchKey};
  params = is_in_debug_mode ? { ...params, is_in_debug_mode } : { ...params };
  const data = await loggedInRequest('eosExpertQcview', params);
  return data;
}


const eosAcceptReject = async (invite_decision, expert_id, survey_id, reject_reason, is_in_debug_mode=false ) => {
  console.log("datapi")
  let params = { invite_decision, expert_id, survey_id, reject_reason};
  params = is_in_debug_mode ? { ...params, is_in_debug_mode } : { ...params };
  const data = await loggedInRequest('accept_or_reject_survey', params);
  return data;
}


const eosExpertviewXE = async (page_num, is_in_debug_mode=false) => {
    let params = { page_num };
    params = is_in_debug_mode ? { ...params, is_in_debug_mode } : { ...params };
    const data = await loggedInRequest('eosExpertviewXE', params);
    return data;
}

const getExpertSurvey = async(surveyid, st) => {
  const params = {'surveyid': surveyid, 'st': st, survey_state: getSurveyType() || ''};
  try {
    const data = await loggedInRequest('get_expert_survey_json', params);
    return data
  }
  catch(ex) {
    console.log(ex)
  }
}

const getAlphaSurveyPreview = async(eosid, medicalcaseid) => {
  const params = {'eosid': eosid, 'medicalcaseid': medicalcaseid};
  try {
    const data = await loggedInRequest('get_alpha_preview_json', params);
    return data
  }
  catch(ex) {
    console.log(ex)
  }
}

const eosResponse = async (eos_id, option, comments, prosp_trial, expert_id,eo_survey_result_id) => {
    const values = {
      eos_id, option, comments, prosp_trial, expert_id,eo_survey_result_id
    }
    const data = await loggedInRequest('eosResponse', values, EOS_EXTENSION);
    return data;
}

const saveEosDraft = async (eos_id, option, comments, expert_id) => {
    if (window.localStorage.getItem('is_in_debug_mode') == 1){
      console.log("Can't save draft in debug mode.")
      return {};
    }
    const values = {
      eos_id, option, comments, expert_id
    }
    const data = await loggedInRequest('save_eos_draft', values, EOS_EXTENSION);
    return data;
}
const saveEosQcDraft = async (eos_id, option, comments, expert_id,eo_survey_result_id) => {
  if (window.localStorage.getItem('is_in_debug_mode') == 1){
    console.log("Can't save draft in debug mode.")
    return {};
  }
  const values = {
    eos_id, option, comments, expert_id,eo_survey_result_id
  }
  const data = await loggedInRequest('save_qc_eos_draft', values, EOS_EXTENSION);
  return data;
}
const getprofile = async () => {
    const data = await loggedInRequest('getprofile');
    return data;
}

const passwordReset = async (oldpass, newpass) => {
    const data = await loggedInRequest('passwordReset', {'oldpass': oldpass, 'newpass': newpass});
    return data;
}

const passwordResetViaLink = async (newpass) => {
  const token = getQueryVariable('token')
  console.log('token : ', token);
  const data = await preLoggedInRequest('passwordReset', {'newpass': newpass, 'alpha_token': token});
  return data;
}

const completeRegistration = async (newpass) => {
  const token = getQueryVariable('token')
  console.log('token : ', token);
  const data = await preLoggedInRequest('complete_registration', {'newpass': newpass, 'alpha_token': token});
  return data;
}

const requestSignup = async (email) => {
  const referrer = getReferrer();
  console.log('requestSignup - ' + referrer);
  return await preLoggedInRequest('request_signup', {'email': email, 'org_name': referrer});
}

const validateLinkToken = async () => {
  const token = getQueryVariable('token')
  return await preLoggedInRequest('validate_link_token', {'token': token});
}

const savePushNotificationToken = async (token, deviceID, platform) => {
  const params = {
    gcmsid: token,
    uniquekey: deviceID,
    platform: platform
  };
  const data = await loggedInRequest('pushnotification', params);
  return data;
}

const logout = async (deviceID) => {
  const data = await loggedInRequest('logout', {uniquekey: deviceID});
  tokenManager.clearToken()
  let locationHref= "/login";
  // localStorage.setItem('loggedOut', true);
  window.location = locationHref;
}

const loginAsExpert = async (username) => {
  let endpoint_url = 'login_as_expert';
  if (useCookie()){
    endpoint_url = 'expertapp_login_as_expert'
  }

  const data = await loggedInRequest(endpoint_url, {expert_username: username});

  if (data && data.userid) {

    const oldUserId = window.localStorage.getItem('userid');

    tokenManager.clearToken();
    tokenManager.updateLoginDataCache(data);
    if(oldUserId !== data.userid) {
      window.localStorage.setItem('is_in_debug_mode', 1)
    }
  }

  return data;
}

const analyticsTracking = async (params) => {
  const data = await requests.post_json('webapi/analytics_tracking', params);
  return data;
}

const expertUnavailability = async ({start_date='', end_date='', reason='', type="get"}) => {
  let obj = {};
  if (type !== "get") {
    obj = { start_date, end_date, reason };
  }
  const data = await loggedInRequest('expert_unavailability', obj);
  return data;
}

const getExpertsDashboard = async (payload) => {
    payload['org'] = getReferrer();
    const data = await loggedInRequest('get_experts_aggregated_data', payload);
    return data;
}

const getExpertSurveyListDashboard = async (payload) => {
  payload['org'] = getReferrer();
  const data = await loggedInRequest('get_expert_survey_list_data', payload);
  return data;
}

const getCaseAggregatedListDashboard = async (payload) => {
  payload['org'] = getReferrer();
  const data = await loggedInRequest('get_case_aggregated_data', payload);
  return data;
}

const getHospitalSummaryDashboard = async (payload) => {
  payload['org'] = getReferrer();
  const data = await loggedInRequest('get_hospital_summary_dashboard', payload);
  return data;
}

const getExpertListByOrg = async () => {
  const payload = {org: getReferrer()};
  const data = await loggedInRequest('get_org_experts', payload);
  return data;
}

const getNextSurveyID = async () => {
  const data = await loggedInRequest('get_next_survey_id');
  return data;
}

export default {
  expertUnavailability,
  analyticsTracking,
  updateInfo,
  baseauth,
  registerDevice,
  authenticate,
  forgotPassword,
  dashboard,
  validateToken,
  getannouncements,
  experttotal,
  experttotalinorg,
  expertlastxdays,
  expertdmgperformance,
  expertspecialityxdays,
  expertspeciality,
  getExpertTotal,
  getExpertTotalInOrg,
  getExpertSpecialty,
  getDMG,
  getDMGOrg,
  orgdmgperformance,
  eosExpertviewXE,
  eosExpertInvitedview,
  eosExpertReviewSubmissionView,
  eosAcceptReject,
  eosExpertviewp,
  eosExpertview,
  eosExpertQcview,
  eosResponse,
  getExpertSurvey,
  getAlphaSurveyPreview,
  getprofile,
  passwordReset,
  logout,
  saveEosDraft,
  saveEosQcDraft,
  savePushNotificationToken,
  loginAsExpert,
  passwordResetViaLink,
  requestSignup,
  completeRegistration,
  validateLinkToken,
  getExpertsDashboard,
  getExpertSurveyListDashboard,
  getNextSurveyID,
  getCaseAggregatedListDashboard,
  getExpertListByOrg,
  getHospitalSummaryDashboard

};
