import {Redirect} from 'react-router-dom';
import tokenManager from './tokenManager';
import { Plugins } from '@capacitor/core';
import { isLoggedIn, isSurveyDetailsPage, getAlertTitle, getSurveySource } from '../utils';

window.alertShownCounter = 0;

export const errorHandler = async (req) => {

  req.on('error', async (res) => {

    const status = res.statusCode || res.status;

    if (status === 503){
      if (window.alertShownCounter === 0) {
        window.alertShownCounter = 1;
        await Plugins.Modals.alert({title: getAlertTitle(), message: "We are undergoing routine maintenance. We will be back online soon."});
      }
    }

    if (res.response && res.response.req) {
      const url = res.response.req.url;

      if (url.indexOf('validatetoken') > -1 || url.indexOf('baseauth') > -1) {
        return;
      }
    }

    const tmanager = new tokenManager();


    switch(status) {
      case 401:
        if (isLoggedIn() && window.alertShownCounter === 0 && res.response && res.response.text) {
            window.alertShownCounter = 1;
            const text = JSON.stringify(res.response.text);
            if (text.toLowerCase().indexOf('token') > -1) {
              tmanager.clearToken();
              await Plugins.Modals.alert({title: getAlertTitle(), message: JSON.parse(res.response.text).error});
              window.location = '/login';
            }
        }
        break;
      case 400:
        res.body && alert(res.body.message);
        break;
      case 500:
      case 501:
      case 502:
      case 504:
        console.log('req.url : ',req.url);

        /**
         * Don't process for specific apis
         * Removed for survey details api too, probably this is one page where it was used heavily, currently unsure
         * if this whole section can be removed/rewritten or not, keeping it alive for now
         */
        if(req.url.indexOf('eosResponse') > -1 ||
          req.url.indexOf('passwordReset') > -1 ||
          req.url.indexOf('complete_registration') > -1 ||
          req.url.indexOf('get_expert_survey_json') > -1) {
          break;
        }

        if (window.alertShownCounter === 0) {
          window.alertShownCounter += 1;
          // tmanager.clearToken();
          const message = res.response && res.response.text && JSON.parse(res.response.text).error ? JSON.parse(res.response.text).error : 'Something went wrong. Please try again after few minutes.';

          const zombiedCondition = isSurveyDetailsPage() && message.toLowerCase().indexOf('case') > -1;

          console.log('force_update in errorHandler : ',sessionStorage.getItem('force_update'));

          const survey_detail_source = getSurveySource();

          console.log('alert title - ' + getAlertTitle());

          setTimeout(async () => {
            await Plugins.Modals.alert({
              title: getAlertTitle(),
              message
            });
            if (zombiedCondition && survey_detail_source !== 'email' && survey_detail_source !== 'notification') {
              window.location = window.location.origin + '/user/home';
            } else if (zombiedCondition && !!!sessionStorage.getItem('force_update_zombied')) {
              window.location = window.location.origin + '/user/home';
            }
          }, 1000);
          if (zombiedCondition) {
            localStorage.setItem('zombiedCaseFlag', 1);
          }
          // window.location = '/login';
        }
      break;
    }
  });
};
