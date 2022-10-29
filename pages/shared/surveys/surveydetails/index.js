import React from 'react';
import cx from 'classnames';
import {
  IonPage, IonContent, IonAlert, IonIcon,
  IonLoading, withIonLifeCycle, IonSpinner
} from '@ionic/react';
import moment from "moment";
import { Header, Modal } from '../../../../common';
import { withRouter } from 'react-router-dom';
import api from '../../../../api/endpoints';
import globalVars from '../../../../globalVars';
import LocalCache from '../../../../api/localCache';
import slideInHorizontalLeft from '../../../../animations/slideinhorizontalleft';
import slideOutHorizontalRight from '../../../../animations/slideouthorizontalright';
import { Plugins } from '@capacitor/core';
import { isAndroid, isMobileApp, showUpdateInfoPopup, deleteSurveySource, deleteTrackingSurvey, getAlertTitle, getQueryVariable, isSmallScreen } from '../../../../utils';
import { avatarStyles } from '../../../../styles/avatars';
import TokenManager from '../../../../api/tokenManager';
import AnalyticsTracker, {
  TRACK_START, TRACK_END, SURVEY_DETAILS_TRACKER,
  SURVEY_COMMENTS_TRACKER, SURVEY_ATTACHMENT_TRACKER,
  SurveyCommentsTracker, SurveyDetailsTracker, SurveyAttachmentTracker
} from '../../../../common/analytics';
import { file } from '@babel/types';
import { Document, Page } from 'react-pdf/dist/entry.webpack'; // https://github.com/wojtekmaj/react-pdf
import PinchZoomPan from './PinchZoomPan';
import IdleTimer from 'react-idle-timer';
import './pdfviewer.less';
import './styles.scss';
import ReactHtmlParser from "react-html-parser";
import RichEditor from "./richEditor";
import { isAccessHope } from '../../../../referrers';
import { removeSlashInComments } from '../../../../utils';

const { Browser } = Plugins;

const options = {
  cMapUrl: 'cmaps/',
  cMapPacked: true,
};

class SurveyDetails extends React.PureComponent {

  constructor(props) {

    super(props);
    //checking referrer
    this.isAccessHope = isAccessHope();

    this.setTimerVariables();

    this.state = {
      expertHTML: null,
      showAlert: false,
      showSurveys: false,
      surveyid: null,
      showAttachment: false,
      attachmentSrc:  null,
      mobilePDFAttachmentSrc: null,
      alertMessage: null,
      showLoading: false,
      loadingMessage: null,
      isOpen: true,
      mobilePDFNumPages: null,
      mobilePDFPageNumber: 1,
      renderAttachmentInIFrame: true,
      showSpinner: false,
      svyDetTimeout: this.svyDetTimeout,
      treatmentOptionID: '', // required by N Api
      comments: '',
      lastTreatmentOptionID: '',
      lastComments: '',
      prospectiveTrialAnswers: {},
      prospectiveTrialQuestionIDs: [],
      synopsisComments: '',
      recommendationComments:'',
      trialComments: '',
      referenceComments: '',
      lastsynopsisComments: "",
      lastrecommendationComments:'',
      lasttrialComments: "",
      lastReferenceComments: "",
      autoSaveTime: "",
      showPreview: false,
      previewSynopsis: "",
      previewRecommendation:'',
      previewTrials: "",
      previewReference: "",
      patientInfo:'',
      isShowPopup:false,
      isManuallySaved:false,
      showInstruction:false,
      priority:'',
      qc:false,
      eo_survey_result_id:'',
      showCommentsSubmitButton:false,
      surveyResponse:''
    }

    this.error = false;
    this.errorMessage = null;
    this.cancelBtnClicked = false;
    this.files = null;
    this.prevAttachmentSrc = null;
    this.nextAttachmentSrc = null;
    window.submitSurveyform = this.submitSurveyform;
    window.OpenFile = this.OpenFile;
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.previousZoomScale = -1;

    /* Idle timer related variables and functions FOR SURVEY DETAIL PARENT PAGE start */
    this.idleTimerSvyDetRef = null;
    this.idleTimerSvyDetOnAction = this.idleTimerSvyDetOnAction.bind(this);
    this.idleTimerSvyDetOnActive = this.idleTimerSvyDetOnActive.bind(this);
    this.idleTimerSvyDetOnIdle = this.idleTimerSvyDetOnIdle.bind(this);
    /* Idle timer related variables and functions FOR SURVEY DETAIL PARENT PAGE end */

    /* Idle timer related variables and functions FOR SURVEY DETAIL ATTACHMENT PAGE start */
    this.svyAttchmtEvntCurntType = null;
    this.svyAttchmtEvntCurrentTargetID = null;
    this.idleTimerSvyAttchmtRef = null;
    this.idleTimerSvyAttchmtOnAction = this.idleTimerSvyAttchmtOnAction.bind(this);
    this.idleTimerSvyAttchmtOnActive = this.idleTimerSvyAttchmtOnActive.bind(this);
    this.idleTimerSvyAttchmtOnIdle = this.idleTimerSvyAttchmtOnIdle.bind(this);
    /* Idle timer related variables and functions FOR SURVEY DETAIL ATTACHMENT PAGE end */

  }

  setTimerVariables = () => {
    if (localStorage && localStorage.getItem('trackerTimers')) {
      const trackerTimers = JSON.parse(localStorage.getItem('trackerTimers'));
      this.svyDetTimeout = trackerTimers.detail;
      SurveyCommentsTracker.trackerTimer = trackerTimers.comment;
      this.svyAttchmtTimeout = trackerTimers.attachment;
    } else {
      this.svyDetTimeout = 1000 * 60;
      this.svyAttchmtTimeout = 1000 * 60;
    }
  }

  initIdleTimerVariables = () => {

    /* Idle timer related variables FOR SURVEY DETAIL PARENT PAGE start */
    this.svyDetEvntCurntType = null;
    this.svyDetEvntCurntTargetID = null;

    /* Idle timer related variables FOR SURVEY DETAIL ATTACHMENT PAGE start */
    this.svyAttchmtEvntCurntType = null;
    this.svyAttchmtEvntCurrentTargetID = null;
  }

  hideAlert = () => {
    this.setState({
      showAlert: false,
      alertMessage: false
    }, () => {
      this.error = false;
    });
  }

  hideLoading = () => {
    this.setState({
      showLoading: false
    });
  }

  hideSpinning= () => {
    this.setState({
      showSpinner: false
    });
  }

  OpenFile = async (filePath) => {
    this.startWindowHistory = window.history.length;
    console.log('start window history - ' + this.startWindowHistory);
    this.currWindowHistory = this.startWindowHistory;
    this.currAttachmentSrcIndex = -1;
    this.renderFile(filePath);
    globalVars.setIsModalVisible(true);
  }

  renderFile(filePath) {
    this.setState({
      showAttachment: true,
      attachmentSrc: null,
      mobilePDFAttachmentSrc: null,
      mobilePDFNumPages: null
    }, () => {
      setTimeout(() => {
        this.filePath = filePath;
        this.renderNextFile();
      }, 300);
    });
  }

  getCurrentAttachmentArc() {
    return this.state.mobilePDFAttachmentSrc || this.state.attachmentSrc;
  }

  viewPrevFile() {

    this.surveyAttachmentAnalyticsTracking(false, {}, {src: this.getCurrentAttachmentArc(), cbFn: this.resumeSvyTrckngIfPreviousAttchmtInIframe});

    if(this.prevAttachmentSrc) {
      this.renderFile(this.prevAttachmentSrc);
    }
  }

  viewNextFile() {

    this.surveyAttachmentAnalyticsTracking(false, {}, {src: this.getCurrentAttachmentArc(), cbFn: this.resumeSvyTrckngIfPreviousAttchmtInIframe});

    if(this.nextAttachmentSrc) {
      this.renderFile(this.nextAttachmentSrc);
    }
  }

  getFilteredFiles() {
    if(!this.files) {
      return [];
    }

    const filteredFiles = [];
    for (let key = 0; key < this.files.length; key++) {
      const obj = this.files[key];
      if(obj && obj.url) {
        filteredFiles.push(obj);
      }
    }

    return filteredFiles;
  }

  renderNextFile() {

    const filteredFiles = this.getFilteredFiles();

    console.log(filteredFiles);

    for (let key = 0; key < filteredFiles.length; key++) {
      console.log(key + ' -- ' + filteredFiles[key].name + ' -- ' + this.currAttachmentSrcIndex);

      // this.currAttachmentSrcIndex is used to avoid loops (due to redundant file urls in the array) on Prev/Next click
      if((this.currAttachmentSrcIndex === -1 || this.currAttachmentSrcIndex !== key) && this.filePath === filteredFiles[key].url) {

        let prevAttachmentSrc = null;
        let nextAttachmentSrc = null;
        if(key > 0) {
          prevAttachmentSrc = filteredFiles[key - 1].url;
        }
        if(key < filteredFiles.length - 1) {
          nextAttachmentSrc = filteredFiles[key + 1].url;
        }

        console.log('attachmentSrc - ' + this.filePath);
        console.log('prevAttachmentSrc - ' + prevAttachmentSrc);
        console.log('nextAttachmentSrc - ' + nextAttachmentSrc);

        this.currAttachmentSrcIndex = key;

        this.loadFileInModal(this.filePath, nextAttachmentSrc, prevAttachmentSrc);
        return;
      }
    }

    if(this.currAttachmentSrcIndex === -1) {
      this.loadFileInModal(this.filePath, null, null);
    }
  }

  pauseSvyTrckngIfAttchmtInIframe = () => {
    /***
      if the attachment is loaded in an iframe then
        -> pause the idle timer for survey-details. Don't let it run.
     ***/
    !!this.state.renderAttachmentInIFrame && this.idleTimerSvyDetRef.pause();
  }

  resumeSvyTrckngIfPreviousAttchmtInIframe = () => {
    /***
      if the previous attachment was loaded in an iframe then
        -> resume the idle timer for survey-details. Let it run.
     ***/
    !!this.state.renderAttachmentInIFrame && this.idleTimerSvyDetRef.resume();
  }


  async loadedFileCb() {
    this.idleTimerSvyDetRef.reset();
    this.surveyAttachmentAnalyticsTracking(true, {}, {src: this.getCurrentAttachmentArc(), cbFn:  this.pauseSvyTrckngIfAttchmtInIframe});
  }

  loadFileInModal(filePath, nextAttachmentSrc, prevAttachmentSrc) {
    this.prevAttachmentSrc = prevAttachmentSrc;
    this.nextAttachmentSrc = nextAttachmentSrc;

    // if(isMobileApp() && filePath.toLowerCase().indexOf('.pdf') > -1) {
    if(filePath.toLowerCase().indexOf('.pdf') > -1) {
      this.setState({
        showSpinner: true
      }, () => {
        this.setState({
          mobilePDFAttachmentSrc: filePath,
          mobilePDFNumPages: null,
          attachmentSrc: null,
          renderAttachmentInIFrame: false,
          svyDetTimeout: this.svyDetTimeout + this.svyAttchmtTimeout
        }, async () => {
          this.loadedFileCb();
        });
      });
    } else {
      let renderAttachmentInIFrame = true;
      if(isMobileApp() && (filePath.toLowerCase().indexOf('.png') > -1 || filePath.toLowerCase().indexOf('.jpg') > -1
        || filePath.toLowerCase().indexOf('.jpeg') > -1)) {
          renderAttachmentInIFrame = false;
      }

      this.setState({
        showSpinner: true
      }, () => {
        this.setState({
          attachmentSrc: filePath,
          mobilePDFAttachmentSrc: null,
          svyDetTimeout: renderAttachmentInIFrame ? this.svyDetTimeout : this.svyDetTimeout + this.svyAttchmtTimeout,
          renderAttachmentInIFrame
        }, async () => {
          this.loadedFileCb();
        });
      });
    }
  }

  handleKeyPress(e) {
    console.log('event - ' + e.keyCode);

    if(this.state.showAttachment) {
      if(e.keyCode === 37) {
        this.viewPrevFile();
      } else if(e.keyCode === 39) {
        this.viewNextFile();
      }
    } else if (this.state.showPreview && e.keyCode === 27){
        this.setState({showPreview:false})
    }else if(this.state.showInstruction && e.keyCode === 27){
      this.setState({showInstruction:false})
    } else {
      if(e.keyCode === 27) {
        this.showSurveysMain();
      }
    }
  }

  hideAttachment = () => {
    globalVars.setIsModalVisible(false);
    console.log('hide attachment');
    this.prevAttachmentSrc = null;
    this.nextAttachmentSrc = null;
    const currentAttachmentSrc = this.getCurrentAttachmentArc();

    this.setState({
      showSpinner: false,
      showAttachment: false,
      attachmentSrc: null,
      mobilePDFAttachmentSrc: null,
      mobilePDFNumPages: null,
      svyDetTimeout: this.svyDetTimeout
    }, async () => {

      this.surveyAttachmentAnalyticsTracking(false, {}, {src: currentAttachmentSrc, cbFn: this.resumeSvyTrckngIfPreviousAttchmtInIframe});

      this.idleTimerSvyDetRef.reset();

      if(this.pinchZoomRef) {
        this.pinchZoomRef.abortAnimationFrames();
      }
    });
  }

  onShowPreview = () => {
    this.setState({
      previewSynopsis: this.state.synopsisComments,
      previewRecommendation:this.state.recommendationComments,
      previewTrials: this.state.trialComments,
      previewReference:this.state.referenceComments,
      showPreview: true,
    });
    this.saveDraft()
  };

  onHidePreview = () => {
    this.setState({
      showPreview: false,
    });
  };

  onOpenInstructions=()=>{
    this.setState({showInstruction:true})
  }

  onHideInstruction=()=>{
    this.setState({showInstruction:false})
  }

  getAutoSaveTime = () => {
    let date = new Date();
    let timeZone = new Date().toString().match(/\(([A-Za-z\s].*)\)/)[1].split(" ").map((x) => x.charAt(0)).join("");
    let time = "Auto Saved at " + date.getHours() + ":" + ((date.getMinutes() < 10) ? "0" : "" ) + date.getMinutes() + " " + timeZone;
    document.getElementById("reference-comments").innerHTML = time?time:'';
    return time;
  };

  // manualSave
  manualSave=()=>{
    this.setState({isManuallySaved:true},()=>{this.saveDraft()})
  }

  saveDraft = async () => {
    let expert_id = LocalCache.get('expertid');
    let eos_id = this.state.surveyid;
    let option = this.state.treatmentOptionID;
    let comments = this.state.comments;
    let eo_survey_result_id=this.state.qc && this.isAccessHope? this.state.eo_survey_result_id :''
    let lastOption = this.state.lastTreatmentOptionID;
    let lastComments = this.state.lastComments;
    let apiResponseData;
    // merging comments for accesshope from richeditor
    let accesshopeComments = this.state.synopsisComments + "__splitshortkey__" + this.state.recommendationComments+"__splitshortkey__" +this.state.trialComments +"__splitshortkey__" +this.state.referenceComments;
    let accesshopeLastComments =this.state.lastsynopsisComments+ "__splitshortkey__" + this.state.lastrecommendationComments+ "__splitshortkey__" +this.state.lasttrialComments +"__splitshortkey__" +this.state.lastReferenceComments;
    comments = this.isAccessHope ? accesshopeComments : comments;

    console.log('autoSaving',this.state.isManuallySaved,accesshopeComments === accesshopeLastComments)

    // don't submit if there's no change from last submission attempt
    if ((option === lastOption) && (comments === lastComments)){
      return;
    }
    if (!this.state.isManuallySaved && accesshopeComments === accesshopeLastComments) {
      return;
    }
    if (option || comments) {
      console.log("Auto-saving draft");
      if(this.state.qc){
        console.log('Auto-saving draft')
        apiResponseData= await api.saveEosQcDraft(eos_id, option, comments, expert_id,eo_survey_result_id);
      }
      else{
        apiResponseData= await api.saveEosDraft(eos_id, option, comments, expert_id);
      }
      if(apiResponseData.status===200){
        if (this.isAccessHope){
          this.setState({
              lastsynopsisComments:this.state.synopsisComments,
              lastrecommendationComments:this.state.recommendationComments,
              lasttrialComments: this.state.trialComments,
              lastReferenceComments: this.state.referenceComments,
              autoSaveTime: this.getAutoSaveTime(),
              isManuallySaved:false,
              isShowPopup:true
            },()=>{setTimeout(()=>{this.setState({isShowPopup:false})},3000)});
          }else
            this.setState({
              lastTreatmentOptionID: option,
              lastComments: comments,
            });
      }
      else 
      this.setState({
        showLoading: false,
        showAlert: true,
        alertMessage:"Draft not saved"
      });
      
    }
  }

  submitSurveyform = async () => {

    if(window.localStorage.getItem('is_in_debug_mode') == 1) {
      await Plugins.Modals.alert({title: getAlertTitle(), message: "You can't respond in debug mode"});
      return;
    }

    this.error = false;
    let treatmentOptionID = this.state.treatmentOptionID;
    let comments = this.state.comments;

     // merging comments for accesshope from richeditor
     let accesshopeComments =this.state.synopsisComments +"__splitshortkey__" + this.state.recommendationComments +"__splitshortkey__" +this.state.trialComments +"__splitshortkey__" +this.state.referenceComments;
     comments = this.isAccessHope ? accesshopeComments : comments;

    console.log('treatmentOptionID : ',this.state.treatmentOptionID);
    console.log('comments : ',this.state.comments);
    console.log('****'); /* test-comment to trigger expert-app build */

    if (treatmentOptionID || comments) {
      this.error = false;

      if (comments !== '') {
        comments = comments.replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
      }
    } else {
        this.error = true;
        this.errorMessage = 'Please select an option or leave a comment.';
    }

    if(!this.error) {
        let respondedQuestions = Object.keys(this.state.prospectiveTrialAnswers);
        let allQuestions = this.state.prospectiveTrialQuestionIDs;
        if(!(_.isEqual(respondedQuestions.sort(), allQuestions.sort()))){
            console.log('no response');
            this.error = true;
            this.errorMessage = 'Please complete the questionnaire.';
        }
    }

    if (this.error) {
      this.setState({
        showLoading: false,
        showAlert: true,
        alertMessage: this.errorMessage
      });
    } else {
      this.error = false;
      this.setState({
        showLoading: true,
        loadingMessage: "Submitting"
      }, () => {
        this.postData(treatmentOptionID, comments);
      });
    }
  }

  postData = async (option, comments) => {

    let prosp_trial = JSON.stringify(this.state.prospectiveTrialAnswers);

    let expert_id = LocalCache.get('expertid'); // TODO: grab from state if possible, this may be a vulnerability
    let eos_id = this.state.surveyid;
    let eo_survey_result_id=this.state.qc && this.isAccessHope? this.state.eo_survey_result_id :''

    globalVars.setIsSurveySubmitInProgress(true);

    const data = await api.eosResponse(eos_id, option, comments, prosp_trial, expert_id,eo_survey_result_id);

    globalVars.setIsSurveySubmitInProgress(false);

    try {
      if (data && data.error) {
          this.setState({
            showAlert: true,
            showLoading: false,
            loadingMessage: null,
            alertMessage: data.error
          });
      } else {
        // Update tracking details for the survey once response is submitted.
        // this.analyticsTracking(false);
        this.surveyDetailsAnalyticsTracking(false, {}, {}, true);

        // This function resets few analytics entries. Don't change its call location before proper testing.
        this.resetTrackingDetails();

        this.setState({
          showLoading: false
        }, () => {
          this.setState({
            showLoading: true,
            loadingMessage: isAccessHope() ? 'Thank you for your response. Loading your next case, if applicable' : 'Thank you for your response. Loading your next survey'
          }, async () => {
            const resp = await api.getNextSurveyID();
            setTimeout(() => {
              if (resp && resp.data)
                this.showNextSurveypage(resp.data.survey_id);
              else {
                this.cancelBtnClicked = true;
                this.setState({
                  isOpen: false,
                  surveyid: null,
                  expertHTML: null,
                  showLoading: false,
                  loadingMessage: null
                }, () =>  {
                  window.location = window.location.origin + `/user/home`;
                });
              }
            }, 1500);
          });
        });
      }
    } catch(e) {
      this.setState({
        showLoading: false,
      });
    }
  }

  showNextSurveypage = (survey_id) => {
    if(!this.isAccessHope) 
      globalVars.clearSurveysTab();
    if (isAndroid())
      window.location = window.location.origin + `/user/surveys/${survey_id}`;
    else {
      this.props.history.push(`/user/surveys/${survey_id}`);
    }
  }

  validateTokenCall = async () => {

    const accessToken = localStorage.getItem('token');

    let postData = { userid: localStorage.getItem('userid') };

    if (!!accessToken) {
      postData = {...postData, access_token: accessToken};
    }

    const response = await api.validateToken(postData);

    console.log('validateTokenCall');
    console.log(response);

    if(response && response.success) {
      return true;
    }
    return false;
  }

  getLocationSearchParams() {
    const locationSearch = globalVars.getURILocationSearch();
    if(locationSearch && locationSearch.indexOf('survey_token') > -1) {
      return locationSearch;
    } else {
      let surveyToken = getQueryVariable('survey_token');
      let surveyID = getQueryVariable('survey_id');
      let org = getQueryVariable('org');

      if (surveyToken && surveyID) {
        return `survey_token=${surveyToken}&survey_id=${surveyID}&org=${org}`;
      }

      return null;
    }
  }

  validateTokencallIfSurveyTokenInURL = async () => {
    const locationSearch = this.getLocationSearchParams();
    if (locationSearch) {
      const result = await this.validateTokenCall();
      globalVars.setURILocationSearch(null);

      if (result) {
        await this.showSurveyDetailsSection();
      } else {
        const tokenManager = new TokenManager();
        tokenManager.clearToken();
        window.location = `/login?${locationSearch}`;
      }
    } else {
      await this.showSurveyDetailsSection();
    }
  }

  async ionViewWillEnter() {
    console.log('ionViewWillEnter');
    const info = await Plugins.Device.getInfo();
    this.deviceInfo = {...info};
    this.nonAndroidPlatforms = ['ios', 'web'];

    if (this.componentLoaded) return true;
    this.cancelBtnClicked = false;
    document.title = isAccessHope() ? `Case ${this.props.match.params.surveyid}` : `Survey ${this.props.match.params.surveyid}`;
    // validate token call only when survey token is present and if loggedin
    globalVars.setIsSurveySubmitInProgress(false);
    await this.validateTokencallIfSurveyTokenInURL();
  }

  ionViewWillLeave() {
    console.log('ionViewWillLeave');
    document.removeEventListener('keydown', this.handleKeyPress);

    this.componentLoaded = null;
    this.surveyDetailsAnalyticsTracking(false, {}, {isSurveyDetPageOnUnmount: true});

    // This function resets few analytics entries. Don't change its call location before proper testing.
    this.resetTrackingDetails();

    if (!this.cancelBtnClicked) {
      this.setState({
        isOpen: false,
        surveyid: null,
        expertHTML: null
      });
    }
  }

  async componentDidUpdate(prevProps, prevState) {
    const currentSurveyID = this.props.match.params.surveyid;
    const prevSurveyID = prevProps.match.params.surveyid;
    if (!!currentSurveyID && !!prevSurveyID && currentSurveyID !== prevSurveyID) {
      this.componentLoaded = true;
      this.cancelBtnClicked = false;
      await this.showSurveyDetailsSection();
    }
  }

  clearNotificationsIfPresent = async () => {
    if (isMobileApp()) {
      const pN = Plugins.PushNotifications;
      window.pN = pN;
      let deliveredNotificationsList = await pN.getDeliveredNotifications();
      deliveredNotificationsList = deliveredNotificationsList.notifications || deliveredNotificationsList;
      console.log('deliveredNotificationsList : ',deliveredNotificationsList);
      if (deliveredNotificationsList.length === 0) return;
      const currentSurveyID = window.location.pathname.match(/\d+/gi)[0];
      if (isAndroid()) {
        await pN.removeAllDeliveredNotifications();
      } else {
        for(let c = 0; c < deliveredNotificationsList.length; c++) {
          const notificationItem = deliveredNotificationsList[c].data.aps;
          if (notificationItem.sid && currentSurveyID == notificationItem.sid) {
            console.log(notificationItem);
            console.log(JSON.stringify(notificationItem));
            await pN.removeDeliveredNotifications({notifications: [deliveredNotificationsList[c]]});
            break;
          }
        }
      }
    }
  }

  surveyLoadSuccessCb = async () => {
    showUpdateInfoPopup();
    await this.clearNotificationsIfPresent();
    if (this.serverSurveyResponse) {
      if (this.deviceInfo.platform !== 'web') {
        document.getElementById('txtcomments').addEventListener('focus', this.hideBottomBarOnFocus);
        document.getElementById('txtcomments').addEventListener('blur', this.hideBottomBarOnBlur);
      }
      document.addEventListener('keydown', this.handleKeyPress);
      this.addClickListenersOnLinks();
      // initializing idle timer variables on load of every new survey
      this.initIdleTimerVariables();
    }
  }

  onSelectTreatmentOption = (event) => {
    this.setState({treatmentOptionID: event.target.value});
  }

  onModifyComment = (event) => {
    this.setState({comments: event.target.value});
  }

  onModifyAccesshopeComment = (name, value,id) => {
    this.setState({ [name]: value });
    this.onPositionEditorToolbarAtBottom(id)
  };

  onPositionEditorToolbarAtBottom=(id)=>{
    const editorElement=document.getElementById(id+'-id')
    const editorContainerElement=document.getElementById(id+'-editor-container')
    const toolbarElement=document.getElementById(id)
    const editorContainer=editorElement.childNodes[0]    
    const editorHeight=editorElement.offsetHeight;
    if(editorHeight>444){
      toolbarElement.classList.add('toolbar-bottom')
      editorContainer.classList.add('editor-bottom')
      editorContainerElement.classList.add('editor-container-bottom')
    }else{
      toolbarElement.classList.remove('toolbar-bottom')
      editorContainer.classList.remove('editor-bottom')
      editorContainerElement.classList.remove('editor-container-bottom')
    }
  }

  onEditResponse = (response) => {
    this.setCommentsToEditorBox(response)
  };

  onEditDraft = (responseComments,surveyResponse) => {
    const response=surveyResponse.qc?{...responseComments.save_as_draft, eo_survey_result_id:responseComments.eo_survey_result_id }: surveyResponse.draft
    this.setCommentsToEditorBox(response)
  };

  setCommentsToEditorBox=(response)=>{
    const element = document.getElementById("scroll-to-top");
    setTimeout(()=>{
      element.scrollIntoView({ block: 'start',  behavior: 'smooth' });
    },1000)
    this.setState({
      synopsisComments: removeSlashInComments(response.comments),
      recommendationComments:removeSlashInComments(response.recommendation_comments),
      trialComments: removeSlashInComments(response.clinical_comments),
      referenceComments: removeSlashInComments(response.clinical_reference_comments),
      eo_survey_result_id:response.eo_survey_result_id,
      showCommentsSubmitButton:true
    },()=>{
      this.renderFullSureveyResponse()
      console.log('after edit',this.state.eo_survey_result_id)
    });
  }

  onViewResponse = (response) => {
    this.setState({
      previewSynopsis: removeSlashInComments(response.comments),
      previewRecommendation:removeSlashInComments(response.recommendation_comments),
      previewTrials: removeSlashInComments(response?.clinical_comments),
      previewReference: removeSlashInComments(response?.clinical_reference_comments),
      showPreview: true,
    });
  };

  onSelectProspectiveTrialAnswer = (event) => {
    let prospectiveTrialAnswers = this.state.prospectiveTrialAnswers;
    prospectiveTrialAnswers[event.target.name] = event.target.value;
    console.log(prospectiveTrialAnswers);
    this.setState({prospectiveTrialAnswers: prospectiveTrialAnswers});
  }

  onCheckProspectiveTrialAnswer = (event) => {
    let prospectiveTrialAnswers = this.state.prospectiveTrialAnswers;
    // to uncheck and check answers
    if(prospectiveTrialAnswers[event.target.name]){
      let newVal=prospectiveTrialAnswers[event.target.name].split(',')
      let currentVal=event.target.value
      // check the answer
      if(newVal.indexOf(currentVal)===-1)
        newVal.push(currentVal)
      else
        newVal=newVal.filter(id=>id!==currentVal)
      // to delete the question id if ni answer is selected in checkbox
      if(newVal.length===0)
      delete prospectiveTrialAnswers[event.target.name]
      else
      prospectiveTrialAnswers[event.target.name] = newVal.join();
    }else{
      prospectiveTrialAnswers[event.target.name] = event.target.value;
    }
    this.setState({ prospectiveTrialAnswers: prospectiveTrialAnswers });
  };

  addDraftToState = (draft) => {
    draft && draft.treatment_option_id ? this.setState({ treatmentOptionID: draft.treatment_option_id,lastTreatmentOptionID: draft.treatment_option_id}): this.setState({ treatmentOptionID: "" });
    draft && draft.comments ? this.setState({ comments: draft.comments,lastComments: draft.comments,synopsisComments: removeSlashInComments(draft.comments),lastsynopsisComments: removeSlashInComments(draft.comments),recommendationComments:removeSlashInComments(draft.recommendation_comments),lastrecommendationComments:removeSlashInComments(draft.recommendation_comments), trialComments: removeSlashInComments(draft?.clinical_comments),lasttrialComments: removeSlashInComments(draft?.clinical_comments),referenceComments: removeSlashInComments(draft?.clinical_reference_comments),lastReferenceComments: removeSlashInComments(draft?.clinical_reference_comments)}): this.setState({comments: "",synopsisComments: '',recommendationComments:'', trialComments: '',referenceComments: ''});
  };

  // multi disciplinary responses table
  renderOptions = (response,surveyResponse) => {
    const { secondColumn, option } = response;
    let returnData = option;

    // only show draft when the survey have a expert draft or qc draft or not the completed survey.
    let showEditDraft = response.edit_response && ( response.save_as_draft || surveyResponse.draft )

    // only show edit response button when the survey not have a draft and not the completed survey.
    let showEditResponse =  response.edit_response && !showEditDraft 

    if (this.isAccessHope) {
      // whether the survey is pending or not
      if(option==='Pending')
        return returnData
      // whether we have to show edit & view or view response only
      if (secondColumn === "You" || surveyResponse.qc) {
        // show both edit and view response
        returnData = (
          <>
            <span
              onClick={() => this.onViewResponse(response)}
              className="other-response-action-button margin-right-15"
            >
              View Response
            </span>
            {showEditResponse&&<span
              onClick={() => this.onEditResponse(response)}
              className="other-response-action-button margin-right-15"
            >
              Edit Response
            </span>}
            {showEditDraft&&<span
              onClick={() => this.onEditDraft(response,surveyResponse)}
              className="other-response-action-button"
            >
              {surveyResponse.qc ? "Edit QC Draft" : "Edit Draft"}
            </span>}
          </>
        );
      } else {
        // show only view response
        returnData = (
          <span
            onClick={() => this.onViewResponse(response)}
            className="other-response-action-button"
          >
            View Response
          </span>
        );
      }
    }
    return returnData;
  };

  renderFullSureveyResponse=()=>{
    const expertHTMLData = this.renderSurvey(this.state.surveyResponse)
    this.setState({ expertHTML: expertHTMLData })
  }

  renderSurvey = (surveyResponse) => {
    this.addDraftToState(surveyResponse.draft);

    // hide commentsbox and submit button
    const hideCommentsBoxSubmitButton=this.isAccessHope && (surveyResponse.qc || surveyResponse.case_status==='completed') && !this.state.showCommentsSubmitButton

    // setState patient information for preview section
    this.setState({ patientInfo: surveyResponse.patient_details, priority: surveyResponse.priority, qc: surveyResponse.qc, surveyResponse:surveyResponse })

    let heading = <div />
    let otherResponsesHeading = <div />
    let treatmentOptionsHeading = <div />

    if (surveyResponse.labels){
      const survey_id = surveyResponse.labels.survey_id || "";
      const medical_case_id = surveyResponse.labels.case_id || "";
      heading = isAccessHope() ? null : <div className="sub-heading-section multi-column"><div>Survey ID: {survey_id}</div><div>Medical Case ID: {medical_case_id}</div></div>;
      const otherResponsesHeading_text = surveyResponse.labels.other_responses || null;
      otherResponsesHeading = <div id='scroll-to-top' className="heading-section paragraph"><div>{otherResponsesHeading_text}</div></div>;
      const treatmentOptionsHeading_text = surveyResponse.labels.treatment_options || null;
      treatmentOptionsHeading = this.isAccessHope?<div/>:<div className="heading-section paragraph"><div>{treatmentOptionsHeading_text}</div></div>;
    }

    // surveyResponse.survey = "<div class=\"survey-client\"> <div class=\"survey-field clinical_diagnosis\">  <div class=\"multi-column\">   <div class=\"title-column\">    <span class=\"display-name\">     Clinical Diagnosis    </span>   </div>   <div class=\"description-column\">    <span class=\"value\">     DCIS    </span>    <span class=\"date\">    </span>   </div>  </div>  <div class=\"paragraph\">   <div class=\"multi-column\">    <div class=\"title-column\">     Note:    </div>    <div class=\"description-column\">     <span class=\"comment\">      DCIS     </span>    </div>   </div>  </div> </div> <div class=\"survey-field clinical_tnm_category\">  <div class=\"multi-column\">   <div class=\"title-column\">    <span class=\"display-name\">     cTNM Stage    </span>   </div>   <div class=\"description-column\">    <span class=\"value\">     Stage I    </span>    <span class=\"date\">    </span>   </div>  </div>  <div class=\"paragraph\">   <div class=\"multi-column\">    <div class=\"title-column\">     Note:    </div>    <div class=\"description-column\">     <span class=\"comment\">      <a class=\"link\" href=\"https://process.dev.bestopinions.us/analyst/medicalReportManagement/7790/21889/1/2094#attach_original_files\" target=\"_blank\">       attached      </a>     </span>    </div>   </div>  </div> </div> <div class=\"survey-field clinical_tnm_stage\">  <div class=\"multi-column\">   <div class=\"title-column\">    <span class=\"display-name\">     cTNM Sub Stage    </span>   </div>   <div class=\"description-column\">    <span class=\"value\">     Stage IA    </span>    <span class=\"date\">     [January 01, 2000]    </span>   </div>  </div>  <div class=\"paragraph\">   <div class=\"multi-column\">    <div class=\"title-column\">     Note:    </div>    <div class=\"description-column\">     <span class=\"comment\">      <a class=\"link\" href=\"s3:discharge2-01421962-8bf4-4ee5-81c0-cedeccfb6f51.pdf\" target=\"_blank\">       attached      </a>     </span>    </div>   </div>  </div> </div> <div class=\"survey-table pt_arms\">  <div class=\"table-title\">   <span class=\"display-name\">    pt_arms   </span>  </div>  <table>   <tr>    <th class=\"regimen-name\">     regimen_name    </th>   </tr>   <tr>    <td>     A(30)q15#3/C.iv(3000)q15#4    </td>   </tr>  </table>  <div class=\"multi-column\">   <div class=\"title-column\">    Note:   </div>   <div class=\"description-column\">    <span class=\"comment\">     Lives alone. Social History details: Pt lives alone, will be staying in the city in elevator building after discharge from MSK.    </span>   </div>  </div> </div></div>"

    let surveyHTML = surveyResponse.survey

    const referrer = localStorage.getItem('referrer');
    let referrerCSS = avatarStyles[referrer] || avatarStyles['navya'];

    surveyHTML = surveyHTML.replace(/(#D7D6D8)/g, '#737373');
    surveyHTML = surveyHTML.replace(/(>&nbsp;)/g, '>'); // delete extra space at the beginning of lines in a class
    surveyHTML = surveyHTML.replace(/(#b657a0)/g, referrerCSS.color);
    if (referrer.toLowerCase() === 'mskcc' || referrer.toLowerCase() === 'pm' || referrer.toLowerCase() === 'accesshope') {
      surveyHTML = surveyHTML.replace(/(#542877)/g, '#000');
    }

    const question = <div className="card" dangerouslySetInnerHTML={{ __html: surveyHTML }} />;

    const otherResponses = (<div className="other-response-section">
      <table>
      {surveyResponse.other_responses.map((response, index) => {
        if (index == 0) {
          if (response.title) {
            return (<tr key={`response_${index}`}><td>{response.title}</td></tr>)
          }
          return (
            <tr key={`response_${index}`}>
              <th>{response.firstColumn}</th>
              {this.isAccessHope && <th>{response.secondColumn}</th>}
              {surveyResponse.qc && <th>{response.thirdColumn}</th>}
              <th>{response.option}</th>
              {!this.isAccessHope && <th>{response.comments}</th>}
            </tr>
          )
        }
        else {
        return (
          <tr key={`response_${index}`}>
            <td className={cx({"first-column-you": response.firstColumn === "You" })}>{response.firstColumn}</td>
            {this.isAccessHope && <td>{response.secondColumn}</td>}
            {surveyResponse.qc && <td>{response.thirdColumn}</td>}
            <td>{this.renderOptions(response,surveyResponse)}</td>
            {!this.isAccessHope && <td>{response.comments}</td>}
          </tr>
        )
      }
      })}
      </table>
    </div>);

    console.log(this.state.treatmentOptionID)

    let treatmentOptions = null;

    if (surveyResponse.treatment_options && surveyResponse.treatment_options.length && referrer !== "accesshope"){
      treatmentOptions = (<div className="treatment-option-section">
        {surveyResponse.treatment_options.map((option, index) => (
            <div className="treatment-option">
              <label for={`option_${index}`}><input key={`option_${index}`} id={`option_${index}`} onClick={this.onSelectTreatmentOption} className="treatment-button" value={option.value} defaultChecked={option.value === this.state.treatmentOptionID} name="treatment" type="radio" /><span className="treatment-name">{option.name}</span></label>
            </div>
        ))}
      </div>);
    }

    const commentsBox = this.isAccessHope ? (
      <div className={` ${hideCommentsBoxSubmitButton?'hide-comments-submit-button':''} accesshope-rich-editor-groups`}>
        <div className='rich-editor-header'>{surveyResponse.qc ? "Please provide your QC of the expert review below:" : "Please provide your review below:"} {/*<span onClick={this.onOpenInstructions} className='editor-instrcution-btn'>Instructions</span>*/}</div>
        <h5 className='rich-editor-subheader'>Synopsis:</h5>
        <RichEditor
          onChange={(val) => this.onModifyAccesshopeComment("synopsisComments",val,"rich-editor-synopsis")}
          save={this.saveDraft}
          value={this.state.synopsisComments}
          className="rich-editor-synopsis"
        />
        <h5 className='rich-editor-subheader'>Recommendations:</h5>
        <RichEditor
          onChange={(val) => this.onModifyAccesshopeComment("recommendationComments",val,"rich-editor-recommendation")}
          save={this.saveDraft}
          value={this.state.recommendationComments}
          className="rich-editor-recommendation"
        />
        <h5 className='rich-editor-subheader'>Clinical Trial Recommendations:</h5>
        <RichEditor
          onChange={(val) => this.onModifyAccesshopeComment("trialComments", val,"rich-editor-trials")}
          save={this.saveDraft}
          value={this.state.trialComments}
          className="rich-editor-trials"
        />

        <h5 className='rich-editor-subheader'>References:</h5>
        <RichEditor
          onChange={(val) => this.onModifyAccesshopeComment("referenceComments", val,"rich-editor-references")}
          save={this.saveDraft}
          value={this.state.referenceComments}
          className="rich-editor-references"
        />

      </div>
    ) : <textarea name="comments" id="txtcomments" className="comments-box" rows={6} defaultValue={this.state.comments} onChange={this.onModifyComment} placeholder={surveyResponse.labels.comment}/>;

    let prospectiveTrialHeader = <div />
    let prospectiveTrialQuestions = <div />;

    let prospectiveTrialQuestionIDs = []

    if (surveyResponse.trial_questions && !surveyResponse.qc){
      if (surveyResponse.labels && surveyResponse.labels.trial_questions){
        prospectiveTrialHeader = <div className="heading-section paragraph"><div>{surveyResponse.labels.trial_questions}</div></div>;
      }
      prospectiveTrialQuestionIDs = surveyResponse.trial_questions.map((question) => (question.question_id));
      this.setState({prospectiveTrialQuestionIDs: prospectiveTrialQuestionIDs});
      prospectiveTrialQuestions = (
        <div className="trial-questions-section">
          { surveyResponse.trial_questions.map((question, index) => (
            <div>
              <div className="question sub-heading-section" style={{fontWeight: "bold"}}>
                {question.question}
              </div>
              <div onChange={question.tags === "checkbox"? this.onCheckProspectiveTrialAnswer: this.onSelectProspectiveTrialAnswer}>
                {question.answers.map((answer, index) => (<div className="answer" style={{fontWeight: "normal"}}>{this.isAccessHope && question.tags === "checkbox" ? <input key={`option_${index}`} className="answer-button" value={answer.answer_id} name={question.question_id} type="checkbox"/> : <input key={`option_${index}`} className="answer-button" value={answer.answer_id} name={question.question_id} type="radio"/>}<span className="answer-name">{answer.answer}</span></div>))}
              </div>
            </div>
          ))}
        </div>
    );
    }

    const submitButton = <div className={`${hideCommentsBoxSubmitButton?'hide-comments-submit-button':''} submit-button-container ${this.isAccessHope ? "d-flex-space-between" : ""}`}>{this.isAccessHope && (<div className='d-flex-space-between'><input onClick={this.onShowPreview} className="submit-button w-auto margin-0 margin-right-15 accesshope-preview-button" type="button" value="Preview"/><div><input onClick={this.manualSave} className="submit-button w-auto margin-0 accesshope-preview-button" type="button" value="Save draft"/><span className="auto-save-time"><span id="reference-comments"></span></span></div></div>)}<input className={`submit-button ${this.isAccessHope ? "margin-0" : ""}`} type="button" value="Submit Opinion" onClick={this.submitSurveyform}/></div>;

    let survey = [heading, question, otherResponsesHeading, otherResponses, treatmentOptionsHeading, treatmentOptions, commentsBox, prospectiveTrialHeader, prospectiveTrialQuestions, submitButton];

    return survey;
  }

  showSurveyDetailsSection = () => {

    // Deleting the surveyDetPageTracking session storage
    // This is set in app-state-change listener (in app.js file)
    // to save the values of surveyDetPageTracking in the sessionStorage,
    // if comments/details/attachement is tracked
    const referrer = localStorage.getItem("referrer");
    if (sessionStorage.getItem('surveyDetPageTracking'))
      sessionStorage.removeItem('surveyDetPageTracking');

    this.setState({
      showLoading: true,
      loadingMessage: '',
      isOpen: true
    }, async () => {
      const surveyid = this.props.match.params.surveyid

      try {
        let expertHTMLData = null;
        let checkForNextSurvey = false;
        this.serverSurveyResponse = false;
        // const org_name = this.isAccessHope ? referrer : "";
        const surveyResponse = await api.getExpertSurvey(surveyid, 'edit');
        if(surveyResponse.survey || surveyResponse.survey == "") {
          // Survey content is returned from server
          console.log("In if(surveyResponse.survey)")
          expertHTMLData = this.renderSurvey(surveyResponse);
          this.serverSurveyResponse = true;
        } else if(surveyResponse.error && !surveyResponse.client_error) {
          /**
           * This will be triggered when survey is reverted or process case is cancelled
           * We will print the error message and we will try to load the next survey automatically after n seconds
           * Chk below for this implementation
           */
          expertHTMLData = <div class='error-message'>{surveyResponse.error}</div>;
          checkForNextSurvey = true;
        } else {
          /**
           * Possibility of ongoing build
           * Redirecting to homepage also does'nt make sense
           * Throw a message to chk back after sometime
           */
          expertHTMLData = <div class='error-message'>{surveyResponse.error}</div>;
        }

        this.files = surveyResponse && surveyResponse.files;
        this.setState({
          expertHTML: expertHTMLData,
          surveyid: surveyid,
          showLoading: false,
          showAlert: false,
          alertMessage: false,
        }, async () => {
          await this.surveyLoadSuccessCb();
        });

        /**
         * Check if current survey threw an error, if yes, wait for 2 seconds for the expert to read the message
         * then try to load the next survey in queue automatically, if no next survey present, redirect to home page
         */
        if(checkForNextSurvey) {
          setTimeout(async () => {
            const nextSurveyIDResponse = await api.getNextSurveyID();
            if(nextSurveyIDResponse && nextSurveyIDResponse.data && nextSurveyIDResponse.data.survey_id) {
              this.setState({
                expertHTML: <div className='error-message'>{isAccessHope() ? "Loading next case..." : "Loading next survey..." }</div>
              });
              setTimeout(async () => {
                this.showNextSurveypage(nextSurveyIDResponse.data.survey_id);
              }, 1000);
            } else {
              window.location = window.location.origin + '/user/home';
            }
          }, 2000);
        }
      } catch(e) {
        console.log('errr',e)
        this.setState({
          showLoading: false
        });
      }
    });

  }

  addClickListenersOnLinks() {
    const urls = document.querySelectorAll('a');

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      // Listen for a click event on each hyperlink found
      url.addEventListener('click', async (event) =>
      {
        // Retrieve the href value from the selected hyperlink
        event.preventDefault();
        const link = event.target.href;

        // do nothing when clicked a link tag in editor
         const clsName=event.target.className
         if(clsName==='ql-action'||clsName==='ql-remove')
          return
        // do nothing when clicked a link tag in editor

        // Log values to the console and open the link within the InAppBrowser plugin
        console.log('Name is: ' + event.target.innerText);
        console.log('Link is: ' + link);

        console.log('S3 link index - ' + link.indexOf('s3.amazonaws.com'));
        if(link.indexOf('s3.amazonaws.com') > -1 || link.indexOf('navya.dicomgrid.com') > -1) {
          this.OpenFile(link);
        } else {
          await Browser.open({ url: link});
        }
      }, false);
    }
  }

  hideBottomBarOnBlur = () => {
    const ionModalContainer = document.getElementsByTagName('ion-modal')[0];
    const existingClassNames = ionModalContainer.className;
    const updatedClassNames = existingClassNames.replace(' input-focussed', '');
    document.getElementsByTagName('ion-modal')[0].className = updatedClassNames;
  }

  hideBottomBarOnFocus = (e) => {
    const ionModalContainer = document.getElementsByTagName('ion-modal')[0];
    const existingClassNames = ionModalContainer.className;
    const updatedClassNames = existingClassNames + ' input-focussed';
    document.getElementsByTagName('ion-modal')[0].className = updatedClassNames;
  }

  async componentWillUnmount() {
    console.log('componentWillUnmount');
    // clearTimeout(AnalyticsTracker.timer);
    // this.clearAnalyticsStateinterval();

    // This function resets few analytics entries. Don't change its call location before proper testing.
    this.resetTrackingDetails();

    if (this.deviceInfo.platform !== 'web') {
      if (document.getElementById('txtcomments')) {
        document.getElementById('txtcomments').removeEventListener('focus', this.hideBottomBarOnFocus);
        document.getElementById('txtcomments').removeEventListener('blur', this.hideBottomBarOnBlur);
      }
    }
  }

  // This function resets few analytics entries. Don't change its call location before proper testing.
  resetTrackingDetails() {
    deleteSurveySource();
    deleteTrackingSurvey();
    globalVars.setIsSurveySubmitInProgress(false);
  }

  analyticsTracking(startTracking, trackerTimer=4000) {
    new AnalyticsTracker(startTracking ? TRACK_START : TRACK_END, { 'survey_id': this.state.surveyid }, trackerTimer);
  }

  async surveyCommentsAnalyticsTracking(startTracking, event={}, params={}) {
    const updatedParams = { ...params, idleTimerSvyDetRef: this.idleTimerSvyDetRef };
    SurveyCommentsTracker.init(startTracking ? SURVEY_COMMENTS_TRACKER.START : SURVEY_COMMENTS_TRACKER.END, { 'survey_id': this.state.surveyid, 'saveDraft': this.saveDraft, ...updatedParams }, event);
    if (!startTracking){
      await this.saveDraft();
    }
  }

  async surveyDetailsAnalyticsTracking(startTracking, event={}, params={}, skipSaveDraft=false) {
    const updatedParams = { ...params, idleTimerSvyDetRef: this.idleTimerSvyDetRef };
    SurveyDetailsTracker.init(startTracking ? SURVEY_DETAILS_TRACKER.START : SURVEY_DETAILS_TRACKER.END, { 'survey_id': this.state.surveyid, 'saveDraft': this.saveDraft, ...updatedParams }, event);
    if (!startTracking && !skipSaveDraft){
      await this.saveDraft();
    }
  }

  async surveyAttachmentAnalyticsTracking(startTracking, event={}, params={}) {
    const updatedParams = { ...params, idleTimerSvyDetRef: this.idleTimerSvyDetRef, idleTimerSvyAttchmtRef: this.idleTimerSvyAttchmtRef };
    SurveyAttachmentTracker.init(startTracking ? SURVEY_ATTACHMENT_TRACKER.START : SURVEY_ATTACHMENT_TRACKER.END, { 'survey_id': this.state.surveyid, 'saveDraft': this.saveDraft, ...updatedParams }, event);
    if (!startTracking){
      await this.saveDraft();
    }
  }

  showSurveysMain = () => {
    this.cancelBtnClicked = true;
    this.setState({
      isOpen: false,
      expertHTML: null,
      showCommentsSubmitButton:false
    }, () =>  {
      sessionStorage.setItem('resfresh_survey_table','true')
      this.props.history.push('/user/surveys');
    });
  }

  isCorrectSurvey = () => {
    return (this.state.surveyid === this.props.match.params.surveyid)
  }

  openAttachmentInBrowser = () => {
    window.open(this.state.attachmentSrc);
  }

  onImageLoad() {
    console.log('image loaded');
    this.hideSpinning();

    if(this.pinchZoomRef) {
      this.pinchZoomRef.updateInitialState();
    }
  }

  iFrameLoad = async () => {
    console.log('iframe loaded');
    this.hideSpinning();
    // this.surveyAttachmentAnalyticsTracking(true);
  }

  onDocumentLoadSuccess = ({ numPages }) => {
    console.log('onDocumentLoadSuccess');
    console.log(numPages);
    this.setState({
      mobilePDFNumPages: numPages
    }, async ()=> {
      this.hideSpinning();
      console.log(this.getAttachmentContainerSize());
      setTimeout(()=> {
        if(this.pinchZoomRef) {
          this.pinchZoomRef.updateInitialState();
        }
      }, 100);
    });
  }

  onPageLoadProgress = ({ loaded, total }) => {
    console.log('Loading a document: ' + (loaded / total) * 100 + '%');
  }

  onPageLoadSuccess = (page) => {
    console.log('onPageLoadSuccess');

    console.log(this.getAttachmentContainerSize());

    if(page && page.pageNumber == this.state.mobilePDFNumPages) {
      console.log('last pdf page loaded - ' + page.pageNumber);

      this.forceUpdate(()=> {
        setTimeout(()=> {
          if(this.pinchZoomRef) {
            this.pinchZoomRef.updateInitialState();
          }
        }, 100);
      });
    }
  }

  onDocumentLoadError = ({error}) => {
    console.log('onDocumentLoadError');
    console.log(error);
    this.hideSpinning();
  }

  getAttachmentContainerSize() {
    let el = document.querySelector('#attachment-container');
    if(el) {
      const attachmentContainerWidth = Math.min(el.offsetWidth, 600);
      const attachmentContainerHeight = el.scrollHeight;
        return [attachmentContainerWidth, attachmentContainerHeight];
    }

    return null;
  }

  eventChangeSvyDetTracking = async(event) => {
    // added the below condition to track if the event change STARTS / STOPS  happen.
    // console.log('event.type : ', event.type);
    if (event.type !== this.svyDetEvntCurntType) {
      if (this.svyDetEvntCurntType === null) {
        // enters here when the user loads the survey details page for the first time
        // console.log('inside here : ',this.svyDetEvntCurntType);
        SurveyDetailsTracker.trackType === SURVEY_DETAILS_TRACKER.END && this.surveyDetailsAnalyticsTracking(true, event);
      } else if (event.target.id === 'txtcomments' && event.type === 'keydown') {
        // this condition is when keydown STARTS
        // enters here when the user starts typing in survey comments box
        console.log('SURVEY COMMENTS START IF');
        this.surveyCommentsAnalyticsTracking(true, event);
      } else if (this.svyDetEvntCurntTargetID === 'txtcomments' && this.svyDetEvntCurntType === 'keydown') {
        // this condition is when keydown STOPS
        // ENTERS HERE WHEN the user types in survey comment box and then he decides to scroll or perform another action other than typing
        // the first CONDN in the below line is to call the stop tracking only once when the user stops commenting for 2 seconds and then after that he scrolls upwards or downwards
        console.log('INSIDE HERE: SurveyCommentsTracker.trackType :: ',SurveyCommentsTracker.trackType);
        SurveyCommentsTracker.trackType === SURVEY_COMMENTS_TRACKER.START && this.surveyCommentsAnalyticsTracking(false, event);
      }
    } else {
      // this else is while the previous-event i.e this.svyDetEvntCurntType and the current-event i.e event.type are the same
      if (event.target.id === 'txtcomments' && event.type === 'keydown') {
        // this is when the user is typing withing the comments section
        // console.log('SURVEY COMMENTS START ELSE ');
        this.surveyCommentsAnalyticsTracking(true, event);
      }
    }
  }

  async idleTimerSvyDetOnAction (event) {
    // below function is for tracking on-event-change
    // console.log('USER IN idleTimerSvyDetOnAction FUNCTION !');
    await this.eventChangeSvyDetTracking(event);
    this.svyDetEvntCurntType = event.type;
    this.svyDetEvntCurntTargetID = event.target.id;
    // console.log('this.svyDetEvntCurntType : ',this.svyDetEvntCurntType);
    // console.log('this.svyDetEvntCurntTargetID : ',this.svyDetEvntCurntTargetID);
  }

  async idleTimerSvyDetOnActive (event) {
    console.log('user is active', SurveyDetailsTracker.trackType);
    // console.log('time remaining', this.idleTimerRef.getRemainingTime())
    SurveyDetailsTracker.trackType === SURVEY_DETAILS_TRACKER.END && this.surveyDetailsAnalyticsTracking(true, event);
  }

  async idleTimerSvyDetOnIdle (event) {
    // console.log('*** USER IS IDLE IN SURVEY DETAIL PAGE  ***');
    // console.log('user is idle', event);
    // console.log('last active', this.idleTimerRef.getLastActiveTime());
    SurveyDetailsTracker.trackType === SURVEY_DETAILS_TRACKER.START && this.surveyDetailsAnalyticsTracking(false, event);
    await this.saveDraft();
  }

  async idleTimerSvyAttchmtOnAction (event) {
    // below function is for tracking on-event-change
    // await this.eventChangeSvyAttchmtTracking(event);
    this.svyAttchmtEvntCurntType = event.type;
    this.svyAttchmtEvntCurntTargetID = event.target.id;
    // console.log('this.svyAttchmtEvntCurntType : ',this.svyAttchmtEvntCurntType);
    // console.log('this.svyAttchmtEvntCurntTargetID : ',this.svyAttchmtEvntCurntTargetID);
  }

  async idleTimerSvyAttchmtOnActive (event) {
    console.log('*** USER IS ACTIVE IN SURVEY ATTACHMENT PAGE ***');
    // console.log('user is active', event);
    // console.log('time remaining', this.idleTimerRef.getRemainingTime())
    SurveyAttachmentTracker.trackType === SURVEY_ATTACHMENT_TRACKER.END && this.surveyAttachmentAnalyticsTracking(true, event, {src: this.getCurrentAttachmentArc(), cbFn: this.pauseSvyTrckngIfAttchmtInIframe});
  }

  async idleTimerSvyAttchmtOnIdle (event) {
    // console.log('*** USER IS IDLE IN SURVEY ATTACHMENT PAGE  ***');
    // console.log('user is idle', event);
    // console.log('last active', this.idleTimerRef.getLastActiveTime());
    SurveyAttachmentTracker.trackType === SURVEY_ATTACHMENT_TRACKER.START && this.surveyAttachmentAnalyticsTracking(false, event, {src: this.getCurrentAttachmentArc()});
    await this.saveDraft();
  }


  render() {
    let attachmentContainerWidth = 400;
    let attachmentContainerHeight = 700;

    // console.log('attachment container size')
    const size = this.getAttachmentContainerSize();
    if(size) {
      attachmentContainerWidth = size[0];
      attachmentContainerHeight = size[1];
    }

    // console.log('THIS.STATE.SVYDETTIMEOUT : ',this.state.svyDetTimeout);

    // console.log(attachmentContainerWidth);
    // console.log(attachmentContainerHeight);

    const isMobile = isSmallScreen();

    return (
      <React.Fragment>
        <Modal
        isOpen={this.state.isOpen}
        enterAnimation={slideInHorizontalLeft}
        leaveAnimation={slideOutHorizontalRight}
        className={'survey-details-modal-container'}>
        <IonPage className="survey-details-container">
          <Header title={isAccessHope() ? this.state.patientInfo.patientReferenceNo ? `Case ${this.state.patientInfo.patientReferenceNo}` : " " : `Survey ${this.props.match.params.surveyid}`} >
            <ion-icon class="close-btn" name="arrow-back" onClick={() => this.showSurveysMain()}></ion-icon>
          </Header>
          { this.isCorrectSurvey() &&<>
          <div className={cx('auto-save-popup',{'popup-visible': this.state.isShowPopup}, {'popup-hidden': !this.state.isShowPopup})}><div>Saved Draft</div></div>
            <IonContent className="survey-content-section"  scrollEvents={true}>
             {
               this.state.expertHTML &&
               <IdleTimer
                 ref={ref => { this.idleTimerSvyDetRef = ref }}
                 // timeout={1000 * 60 * 2}
                 timeout={this.state.svyDetTimeout}
                 onActive={this.idleTimerSvyDetOnActive}
                 onIdle={this.idleTimerSvyDetOnIdle}
                 onAction={this.idleTimerSvyDetOnAction}
                 // stopOnIdle
                 debounce={250}
               >
                  <div className="surveys-data">
                    {this.state.expertHTML}
                  </div>
              </IdleTimer>
             }
             </IonContent>
             </>
           }


           <IonAlert
             isOpen={this.state.showAlert}
             message={this.state.alertMessage}
             onDidDismiss={this.hideAlert}
             buttons={[
               {
                 text: 'OK',
                 role: 'cancel',
                 cssClass: 'navyaPink'
               }
             ]}
           />
            <IonLoading
             isOpen={this.state.showLoading}
             message={this.state.loadingMessage}
            />
            <Modal
              isOpen={this.state.showAttachment}
              className="attachment-modal-container"
              onDidDismiss={this.hideAttachment}
            >
              <Header>
                <IonIcon className="close-icon" name="close" onClick={this.hideAttachment} />
                {
                  <div className="action-button"><button onClick={() => this.viewPrevFile()} disabled={!this.prevAttachmentSrc}>Prev</button> <button onClick={() => this.viewNextFile()} disabled={!this.nextAttachmentSrc}>Next</button> </div>
                }
              </Header>
              <IonContent ref={node => this.iFrameContainer = node}>
                <div id="attachment-container" style={{"width": "100%", "height": "100%"}}>
                  <IdleTimer
                    ref={ref => { this.idleTimerSvyAttchmtRef = ref }}
                    // timeout={1000 * 60 * 2}
                    timeout={this.svyAttchmtTimeout}
                    onActive={this.idleTimerSvyAttchmtOnActive}
                    onIdle={this.idleTimerSvyAttchmtOnIdle}
                    onAction={this.idleTimerSvyAttchmtOnAction}
                    debounce={250}
                  >
                  {(this.state.attachmentSrc || this.state.mobilePDFAttachmentSrc) && (this.state.renderAttachmentInIFrame ?
                    <iframe
                      id="iframe-data"
                      src={this.state.attachmentSrc}
                      frameborder="0"
                      onLoad={async () => await this.iFrameLoad()}/>
                  :
                  <PinchZoomPan ref={(ref) => this.pinchZoomRef = ref} width={attachmentContainerWidth} height={attachmentContainerHeight}>
                    {(x, y, scale) => (
                    <div
                      style={{
                        pointerEvents: scale === 1 ? 'auto' : 'none',
                        transform: isMobileApp() ? `translate3d(${x}px, ${y}px, 0) scale(${scale})` : 'none',
                        transformOrigin: '0 0',
                      }}>
                      {this.state.attachmentSrc && <img src={this.state.attachmentSrc} onLoad={()=> this.onImageLoad()}/>}

                      {this.state.mobilePDFAttachmentSrc &&
                        <div className="pdfviewer__container">
                          <div className="pdfviewer__container__document">
                            <Document
                              file={this.state.mobilePDFAttachmentSrc}
                              onLoadSuccess={this.onDocumentLoadSuccess}
                              onLoadError={this.onDocumentLoadError}
                              options={options}
                              renderMode="svg">
                              {
                                Array.from(
                                  new Array(this.state.mobilePDFNumPages),
                                  (el, index) => (
                                    <Page
                                      key={`page_${index + 1}`}
                                      pageNumber={index + 1}
                                      onLoadSuccess={this.onPageLoadSuccess}
                                      renderMode="svg"
                                      scale={isMobile ? "0.5" : "1.5"}
                                    />
                                  ),
                                )
                              }
                            </Document>
                          </div>
                        </div>
                      }
                      </div>
                  )}
                  </PinchZoomPan>
                  )}
                  </IdleTimer>
                </div>
              </IonContent>

              {this.state.showSpinner && <IonSpinner className="modal-spinner"/>}
            </Modal>
            <Modal
              isOpen={this.state.showPreview}
              className="attachment-modal-container"
              onDidDismiss={this.onHidePreview}
            >
              <Header>
                <IonIcon
                  className="close-icon"
                  name="close"
                  onClick={this.onHidePreview}
                />
              </Header>
              <IonContent>
                <div className="survey-preview-section">
                <div className="survey-preview-inner-section">
                  <div className="case-demographic-information">
                    <h5 className="rich-editor-subheader">Patient Demographic Information</h5>
                    <div>
                      <p><span className="demographic-title">Patient Name: </span>{this.state.patientInfo?.name}</p>
                      <p><span className="demographic-title">DOB: </span>{this.state.patientInfo?.dob}</p>
                      <p><span className="demographic-title">Age: </span>{this.state.patientInfo?.age}</p>
                      <p><span className="demographic-title">Gender: </span>{this.state.patientInfo?.gender}</p>
                      { /* <p><span className="demographic-title">Diagnosis: </span>{this.state.patientInfo?.diagnosis}</p> */}
                    </div>
                  </div>
                  <h5 className='rich-editor-subheader'>SYNOPSIS</h5>
                  <div className="comments-section ql-editor">
                    {this.state.previewSynopsis?ReactHtmlParser(this.state.previewSynopsis):''}
                  </div>
                  <h5 className='rich-editor-subheader'>RECOMMENDATIONS</h5>
                  <div className="comments-section ql-editor">
                    {this.state.previewRecommendation?ReactHtmlParser(this.state.previewRecommendation):""}
                  </div>
                  <h5 className='rich-editor-subheader'>CLINICAL TRIAL RECOMMENDATIONS</h5>
                  <div className="comments-section ql-editor">
                    {this.state.previewTrials?ReactHtmlParser(this.state.previewTrials):''}
                  </div>
                  <h5 className='rich-editor-subheader'>REFERENCES</h5>
                  <div className="comments-section ql-editor">
                    {this.state.previewReference?ReactHtmlParser(this.state.previewReference):''}
                    </div>
                    </div>
                  </div>
                </IonContent>
              </Modal>
              <Modal
                isOpen={this.state.showInstruction}
                className="attachment-modal-container"
                onDidDismiss={this.onHidePreview}
              >
                <Header>
                  <IonIcon
                    className="close-icon"
                    name="close"
                    onClick={this.onHideInstruction}
                  />
                </Header>
                <IonContent>
                  <div className="survey-preview-section">
                  <div className="survey-preview-inner-section">
                    <div className="case-demographic-information">
                      <h3>Instructions for Editor:</h3>
                      <p>Copy paste from pdf file can change the format inside the editor.</p>
                  </div>
                  </div>
                </div>
              </IonContent>
            </Modal>
        </IonPage>
        </Modal>

      </React.Fragment>
    );
  }
}

export default withRouter(withIonLifeCycle(SurveyDetails));
