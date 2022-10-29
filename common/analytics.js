
import api from '../api/endpoints';
import { deleteSurveySource, isDebug, getActualSurveyType, setTrackingSurvey,
  getTrackingSurvey, deleteTrackingSurvey, getSurveySource, isSurveyDetailsPage, getCommnSvyDetTrckngParams } from '../utils';
import globalVars from '../globalVars';
import tokenManager from '../api/tokenManager';

export const TRACK_START = 0;
export const TRACK_END = 1;
export const SURVEY_DETAILS_TRACKER = { START: 0, END: 1 };
export const SURVEY_COMMENTS_TRACKER = { START: 0, END: 1 };
export const SURVEY_ATTACHMENT_TRACKER = { START: 0, END: 1 };

class AnalyticsTracker {

  static timer = null

  constructor(trackType=TRACK_START, params=null, trackerTimer=4000) {
    // console.log('inside AnalyticsTracker : trackerTimer : ',trackerTimer);
    this.setInitVars(trackType, params, trackerTimer);
    this.pathname = window.location.pathname;
    if (isDebug()) {
      return
    }
    this.pageType = this.getPageType();
    this.apiParams = this.getParams(params);
    if(this.apiParams) {
      this.callAPI();
    }
  }

  getPageType = () => {
    if (this.surveyPat.test(this.pathname)) {
      return 'survey_details';
    } else if (this.performancePat.test(this.pathname)) {
      return 'performance';
    }
  }

  setInitVars = (trackType, params, trackerTimer) => {
    clearTimeout(AnalyticsTracker.timer);
    this.trackType = trackType;
    this.trackerTimer = trackerTimer;
    this.surveyPat = /(\/user\/surveys\/)\d+/i;
    this.performancePat = /(\/user\/performance\/?)\d+/i;;
  }

  getParams = (params) => {
    let customParams = null;
    if (this.surveyPat.test(this.pathname)) {
      const surveyId = this.pathname.match(/\d+/gi)[0];
      if(!this.isSurveyTrackingReallyNeeded(surveyId)) {
        return null;
      }
      customParams = this.getSurveyParams(surveyId);
    } else if (params && 'survey_id' in params) {
      const surveyId = params.survey_id;
      if(!this.isSurveyTrackingReallyNeeded(surveyId)) {
        return null;
      }
      customParams = this.getSurveyParams(surveyId);
    }

    console.log('*** ' + this.pageType + ' > analytics tracking params - ',params);
    if(customParams) {
      const apiParams = { expertid: localStorage.getItem('expertid') };
      return {...apiParams, ...customParams};
    }

    return null;
    // else if (this.performancePat.test(this.pathname)) {
    //   return { ...apiParams, ...this.getPerformanceParams()};
    // }
  }

  getSurveyParams = (surveyId) => {
    const params = {
      'survey_id': surveyId,
      "source": getSurveySource() || 'direct',
    };
    if (params.source === 'direct') {
      params.survey_state = getActualSurveyType();
    }
    if(this.trackType == TRACK_START) {
      params.track_state = 0;
    } else {
      params.track_state = 1;
    }
    return { "survey": { ...params } };
  }

  getPerformanceParams = () => {
    return {
      "performance" : {}
    }
  }

  isSurveyTrackingReallyNeeded(surveyId) {
    const trackingSurvey = getTrackingSurvey();
    console.log('isSurveyTrackingReallyNeeded - ' + surveyId + ' -- ' + trackingSurvey + ' -- ' + globalVars.isSurveySubmitInProgress());
    if(globalVars.isSurveySubmitInProgress()) {
      return false;
    }

    if(this.trackType == TRACK_START) {
      // If tracking has already started, don't trigger again. Here trackingSurvey is set when analytics call is successful.
      if(surveyId != trackingSurvey) {
        return true;
      } else {
        return false;
      }
    } else {
      // If tracking has not started or trackingSurvey is diff than the curr survey for which you are tryng to stop tracking, don't trigger
      // analytics tracking again to stop tracking.
      if(surveyId != trackingSurvey) {
        return false;
      } else {
        return true;
      }
    }
  }

  callAPI = async () => {
    if(this.trackType == TRACK_END) {
      console.log('*** ' + this.pageType + ' > analytics tracking called - track end');
      await api.analyticsTracking(this.apiParams);
      deleteTrackingSurvey();
    } else {
      AnalyticsTracker.timer = setTimeout(async () => {
        clearTimeout(AnalyticsTracker.timer);
        console.log('*** ' + this.pageType + ' > analytics tracking called - track start : ', this.trackerTimer);
        await api.analyticsTracking(this.apiParams);
        const surveyId = this.apiParams.survey && this.apiParams.survey.survey_id;
        if(surveyId) {
          setTrackingSurvey(surveyId);
        }
      }, this.trackerTimer);
    }
  }
}

export default AnalyticsTracker;

export class SurveyDetailsTracker {

  static trackType = SURVEY_DETAILS_TRACKER.END;

  static init(trackType=null, params={}, event={}) {

    SurveyDetailsTracker.idleTimerSvyDetRef = SurveyDetailsTracker.idleTimerSvyDetRef || params.idleTimerSvyDetRef;

    /****
      if it is not survey-detail page AND params.isSurveyDetPageOnUnmount is NOT SET then stop further execution OR if we are in debug mode the stop further execution
      ***
       -> params.isSurveyDetPageOnUnmount is set to TRUE when we are unmounting from survey-detail page to any other page.
          This is done because of the below two reasons :
          ---> We need to call the callStopTrackingAPI when we are unmounting the survey-detail page.
          ---> When survey-detail page is unmounted, the page URL changes to the new page, AT THIS POINT.
               And hence !isSurveyDetailsPage() will be TRUE.
          ---> Since params.isSurveyDetPageOnUnmount is set to TRUE, the execution flow would continue beyond the below if condition.
          ---> hence isSurveyDetPageOnUnmount variable is introduced.
          ---> isSurveyDetPageOnUnmount is used and set to TRUE ONLY IN THE unmount phase of survey-details page
      ***
    ****/
    if (!isSurveyDetailsPage() && !!!params.isSurveyDetPageOnUnmount || isDebug()) return;

    // the passed trackType is equal to the existing SurveyDetailsTracker.trackType then dont do anything
    if (trackType === SurveyDetailsTracker.trackType) return;

    // if it is survey detail page then continue further execution
    SurveyDetailsTracker.trackType = trackType;

    // console.log('track type assigned : ',SurveyDetailsTracker.trackType);
    // console.log('SurveyDetailsTracker.idleTimerSvyDetRef : ',SurveyDetailsTracker.idleTimerSvyDetRef);

    SurveyDetailsTracker.params =  {
      expertid: new tokenManager().getExpertId(),
      track_view: 'SURVEY', track_state:  trackType,
      survey: { survey_id: params.survey_id || params.survey.survey_id, ...getCommnSvyDetTrckngParams()},
      saveDraft: params.saveDraft
    };

    trackType === SURVEY_DETAILS_TRACKER.START ? SurveyDetailsTracker.callStartTrackingAPI() : SurveyDetailsTracker.callStopTrackingAPI();
  }

  static async callStartTrackingAPI() {
    console.log('TRACKING API CALL START : SURVEY-DETAILS: ',SurveyDetailsTracker.params);
    /****** make api call here ******/
    await api.analyticsTracking(SurveyDetailsTracker.params);
  }

  static async callStopTrackingAPI() {
    console.log('TRACKING API CALL END : SURVEY-DETAILS: ',SurveyDetailsTracker.params);
    /****** make api call here ******/
    await api.analyticsTracking(SurveyDetailsTracker.params);
  }

}


export class SurveyCommentsTracker {

  static timer = null;

  static trackerTimer = SurveyCommentsTracker.trackerTimer || 10000;

  static trackType = SURVEY_COMMENTS_TRACKER.END;

  static init(trackType=null, params={}, event={}) {

    SurveyDetailsTracker.idleTimerSvyDetRef = SurveyDetailsTracker.idleTimerSvyDetRef || params.idleTimerSvyDetRef;

    // if it is not survey detail page OR if we are in debug mode then stop further execution
    if (!isSurveyDetailsPage() || isDebug()) return;

    // if previous and next trackType value is SURVEY_COMMENTS_TRACKER.END then dont execute further
    // this is done to prevent multiple callStopTrackingAPI calls
    // this happens when there are multiple scroll events simultaneously after user types and leaves the comment field idle
       if (trackType === SurveyCommentsTracker.trackType && trackType === SURVEY_COMMENTS_TRACKER.END) return;

    // if it is survey detail page then continue further execution
    const currentEventInPage = event.type || null;

    SurveyCommentsTracker.trackType = trackType;

    SurveyCommentsTracker.params = {
      expertid: new tokenManager().getExpertId(),
      track_view: 'COMMENTS', track_state: SurveyCommentsTracker.trackType,
      survey: { survey_id: params.survey_id || params.survey.survey_id, ...getCommnSvyDetTrckngParams() },
      saveDraft: params.saveDraft
    }

    // console.log('currentEventInPage : ',currentEventInPage);

    if (SurveyCommentsTracker.trackType === SURVEY_COMMENTS_TRACKER.START) {
      SurveyCommentsTracker.callStartTrackingAPI();
    } else if (SurveyCommentsTracker.trackType === SURVEY_COMMENTS_TRACKER.END && currentEventInPage !== 'keydown') {
      SurveyCommentsTracker.callStopTrackingAPINow();
    } else if (SurveyCommentsTracker.trackType === SURVEY_COMMENTS_TRACKER.END) {
      SurveyCommentsTracker.callStopTrackingAPI();
    }
  }

  static async callStartTrackingAPI() {
    if (!!SurveyCommentsTracker.timer === false) {
      /****** make api call here ******/
      console.log('TRACKING API CALL START : SURVEY-COMMENTS: ',SurveyCommentsTracker.params);
      await api.analyticsTracking(SurveyCommentsTracker.params);
    }
    clearTimeout(SurveyCommentsTracker.timer);
    SurveyCommentsTracker.timer = null;
    await SurveyCommentsTracker.callStopTrackingAPI();
  }

  static async callStopTrackingAPI() {
    SurveyCommentsTracker.timer = setTimeout(async () => {
      await SurveyCommentsTracker.callStopTrackingAPINow();
    }, SurveyCommentsTracker.trackerTimer)
  }


  static async callStopTrackingAPINow() {

    clearTimeout(SurveyCommentsTracker.timer);
    SurveyCommentsTracker.timer = null;
    SurveyCommentsTracker.trackType = SURVEY_COMMENTS_TRACKER.END;
    SurveyCommentsTracker.params = { ...SurveyCommentsTracker.params, track_state: SurveyCommentsTracker.trackType };
    console.log('TRACKING API CALL END : SURVEY-COMMENTS: ',SurveyCommentsTracker.params);
    /****** make api call here ******/
    await api.analyticsTracking(SurveyCommentsTracker.params);
  }

}

export class SurveyAttachmentTracker {

  static trackType = SURVEY_DETAILS_TRACKER.END;

  static init(trackType=null, params=null, event={}) {

    SurveyDetailsTracker.idleTimerSvyDetRef = SurveyDetailsTracker.idleTimerSvyDetRef || params.idleTimerSvyDetRef;
    SurveyDetailsTracker.idleTimerSvyAttchmtRef = SurveyDetailsTracker.idleTimerSvyAttchmtRef || params.idleTimerSvyAttchmtRef;

    // if it is not survey detail page OR if we are in debug mode then stop further execution
    if (!isSurveyDetailsPage() || isDebug()) return;

    // if previous and next trackType value is 0 then dont execute further
    // this is done to prevent multiple callStopTrackingAPI calls
    // this happens when is idle in attachments page for more than 5 seconds and then closes attachment page
    if (trackType === SurveyAttachmentTracker.trackType && trackType === SURVEY_ATTACHMENT_TRACKER.END) return;

    // if the passed trackType is equal to the existing SurveyAttachmentTracker.trackType then dont do anything
    if (trackType === SurveyAttachmentTracker.trackType) return;

    params.cbFn && params.cbFn();

    const src = params.src || params.survey.src;

    const getTrackViewType = () => {
      if (src.indexOf('dicom') > -1) return 'DICOM';
      if (src.indexOf('.pdf') > -1) return 'PDF';
      return 'IMAGE';
    }

    const track_view_type = getTrackViewType();

    // if it is survey detail page then continue further execution
    SurveyAttachmentTracker.trackType = trackType;
    SurveyAttachmentTracker.params = {
      expertid: new tokenManager().getExpertId(),
      track_view: 'ATTACHMENT', track_state: SurveyAttachmentTracker.trackType,
      track_view_type,
      survey: {
        src, survey_id: params.survey_id || params.survey.survey_id,
        ...getCommnSvyDetTrckngParams()
      },
      saveDraft: params.saveDraft
    };

    trackType === SURVEY_ATTACHMENT_TRACKER.START ? SurveyAttachmentTracker.callStartTrackingAPI() : SurveyAttachmentTracker.callStopTrackingAPI();
  }

  static async callStartTrackingAPI() {

    console.log('TRACKING API CALL START : SURVEY ATTACHMENT: ',SurveyAttachmentTracker.params);
    /****** make api call here ******/
    await api.analyticsTracking(SurveyAttachmentTracker.params);

    // When attachment-tracker is called, the survey-details tracker is always set to TRUE but,
    /******** Below line execution *************************
       We are calling the suryey-details tracker i.e SurveyDetailsTracker.init when ITS trackType i.e SurveyDetailsTracker.trackType is FALSE/0.
       This scenario / The below line execution will happen when we are in attachment page and when
         -> survey-attachment-stop API i.e SurveyAttachmentTracker.callStopTrackingAPI is called and then later
         -> SurveyDetailsTracker.callStopTrackingAPI is called and then
         -> when we again start attachment-tracking
    **********************************/

    SurveyDetailsTracker.trackType === SURVEY_ATTACHMENT_TRACKER.END && SurveyDetailsTracker.init(SURVEY_ATTACHMENT_TRACKER.START, SurveyDetailsTracker.params);
  }

  static async callStopTrackingAPI() {
    console.log('TRACKING API CALL END : SURVEY ATTACHMENT: ',SurveyAttachmentTracker.params);
    /****** make api call here ******/
    await api.analyticsTracking(SurveyAttachmentTracker.params);
  }
}
