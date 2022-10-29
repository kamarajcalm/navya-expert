import localCache from './localCache';
import {isLoggedIn} from '../utils';
// import {signupToken} from  '../conf';

export const getData = () => {
  let token, userid, expertid, referrer;
  token = localCache.get('token');
  userid = localCache.get('userid');
  expertid = localCache.get('expertid');
  referrer = localCache.get('referrer');

  return { token , userid , expertid , referrer }
};

class tokenManager {
  constructor() {
    this.token = null;
  }

  setToken({token=null, referrer, userid, expertid}) {
    if (token){
      this.token = token;
      localCache.set('token', this.token);
    }
    localCache.set('referrer', referrer);
    localCache.set('userid', userid);
    localCache.set('expertid', expertid);
  }

  getToken() {
    return getData().token;
  }

  getUserId() {
    return getData().userid;
  }

  getExpertId() {
    return getData().expertid;
  }

  getReferrer() {
    return getData().referrer;
  }

  emptyFormHandler(options, req) {}

  addHeaders(req) {

    const authCredentialsOldApp = localStorage.getItem('authCredentials');

    if (authCredentialsOldApp) {
      localStorage.removeItem('authCredentials');
      const authCredentialsObj = JSON.parse(authCredentialsOldApp);
      localStorage.setItem('token', authCredentialsObj.token);
      localStorage.setItem('expertid', authCredentialsObj.expertID);
    }

    let { token=null } = getData();

    if(token && isLoggedIn()) {
      req.set('token', token);
    }
  }

  defaultFormHandler(form_data) {
    const { userid } = getData();
    if (window.localStorage.getItem('is_in_debug_mode')) {
      form_data["is_in_debug_mode"] = window.localStorage.getItem('is_in_debug_mode') || 0
    }
    form_data['userid'] = userid;

  }

  setTokenInResponse(responseToken=null) {
    const currentToken = localStorage.getItem('token');

    if (currentToken && responseToken !== currentToken) {
      localStorage.setItem('token', responseToken);
    }
  }

  updateLoginDataCache(data) {
    let token = data.token || null;
    const referrerName = data.org_name.toLowerCase() || 'tmc';

    window.localStorage.setItem('userid', data.userid);
    window.localStorage.setItem('expertid', data.expertid);
    if (token){
      window.localStorage.setItem('token', token);
    }
    window.localStorage.setItem('referrer', referrerName);
    window.localStorage.setItem('has_survey_access', data.has_survey_access);
    window.localStorage.setItem('has_qc_access', data.has_qc_access);
    window.localStorage.setItem('has_dashboard_access', data.has_dashboard_access);
    const hasDebugAccess = data.has_expert_debug_access || 0;
    window.localStorage.setItem('has_debug_access', hasDebugAccess);

    return referrerName;
  }

  clearToken() {
    this.token = null;
    localCache.remove('token');
    localCache.remove('userid');
    localCache.remove('expertid');
    localCache.remove('has_debug_access');
    localCache.remove('has_qc_access');
    localCache.remove('is_in_debug_mode');
    localCache.remove('last_tracked_survey');
    localCache.remove('is_org_admin');
    localCache.remove('is_expert');
    localCache.remove('has_survey_access');
    localCache.remove('has_dashboard_access');

  }

  clearReferrer() {
    this.token = null;
    localCache.remove('referrer');
  }
}

export default tokenManager;
