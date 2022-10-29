
import React from 'react';
import cx from 'classnames';
import {
  IonPage, IonContent, IonAlert, IonIcon,
  IonLoading, withIonLifeCycle, IonSpinner
} from '@ionic/react';
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
const { Browser } = Plugins;

const options = {
  cMapUrl: 'cmaps/',
  cMapPacked: true,
};

class AlphaSurveyPreviewDetails extends React.PureComponent {

  constructor(props) {

    super(props);

    // this.setTimerVariables();

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
      prospectiveTrialQuestionIDs: []
    }

    this.error = false;
    this.errorMessage = null;
    this.cancelBtnClicked = false;
    this.files = null;
    this.prevAttachmentSrc = null;
    this.nextAttachmentSrc = null;
    // window.submitSurveyform = this.submitSurveyform;
    window.OpenFile = this.OpenFile;
    // this.handleKeyPress = this.handleKeyPress.bind(this);


  }

  // setTimerVariables = () => {
  //   if (localStorage && localStorage.getItem('trackerTimers')) {
  //     const trackerTimers = JSON.parse(localStorage.getItem('trackerTimers'));
  //     this.svyDetTimeout = trackerTimers.detail;
  //     SurveyCommentsTracker.trackerTimer = trackerTimers.comment;
  //     this.svyAttchmtTimeout = trackerTimers.attachment;
  //   } else {
  //     this.svyDetTimeout = 1000 * 60;
  //     this.svyAttchmtTimeout = 1000 * 60;
  //   }
  // }

  // initIdleTimerVariables = () => {
  //
  //   /* Idle timer related variables FOR SURVEY DETAIL PARENT PAGE start */
  //   this.svyDetEvntCurntType = null;
  //   this.svyDetEvntCurntTargetID = null;
  //
  //   /* Idle timer related variables FOR SURVEY DETAIL ATTACHMENT PAGE start */
  //   this.svyAttchmtEvntCurntType = null;
  //   this.svyAttchmtEvntCurrentTargetID = null;
  // }

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

    // this.surveyAttachmentAnalyticsTracking(false, {}, {src: this.getCurrentAttachmentArc(), cbFn: this.resumeSvyTrckngIfPreviousAttchmtInIframe});

    if(this.prevAttachmentSrc) {
      this.renderFile(this.prevAttachmentSrc);
    }
  }

  viewNextFile() {

    // this.surveyAttachmentAnalyticsTracking(false, {}, {src: this.getCurrentAttachmentArc(), cbFn: this.resumeSvyTrckngIfPreviousAttchmtInIframe});

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

  // pauseSvyTrckngIfAttchmtInIframe = () => {
  //   /***
  //     if the attachment is loaded in an iframe then
  //       -> pause the idle timer for survey-details. Don't let it run.
  //    ***/
  //   !!this.state.renderAttachmentInIFrame && this.idleTimerSvyDetRef.pause();
  // }

  // resumeSvyTrckngIfPreviousAttchmtInIframe = () => {
  //   /***
  //     if the previous attachment was loaded in an iframe then
  //       -> resume the idle timer for survey-details. Let it run.
  //    ***/
  //   !!this.state.renderAttachmentInIFrame && this.idleTimerSvyDetRef.resume();
  // }


  // async loadedFileCb() {
  //   this.idleTimerSvyDetRef.reset();
  //   this.surveyAttachmentAnalyticsTracking(true, {}, {src: this.getCurrentAttachmentArc()});
  // }

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
          // this.loadedFileCb();
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
          // this.loadedFileCb();
        });
      });
    }
  }

  // handleKeyPress(e) {
  //   console.log('event - ' + e.keyCode);
  //   if(this.state.showAttachment) {
  //     if(e.keyCode === 37) {
  //       this.viewPrevFile();
  //     } else if(e.keyCode === 39) {
  //       this.viewNextFile();
  //     }
  //   } else {
  //     if(e.keyCode === 27) {
  //       this.showSurveysMain();
  //     }
  //   }
  // }

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

      // this.surveyAttachmentAnalyticsTracking(false, {}, {src: currentAttachmentSrc, cbFn: this.resumeSvyTrckngIfPreviousAttchmtInIframe});

      // this.idleTimerSvyDetRef.reset();

      if(this.pinchZoomRef) {
        this.pinchZoomRef.abortAnimationFrames();
      }
    });
  }

  // saveDraft = async () => {
  //   let expert_id = LocalCache.get('expertid');
  //   let eos_id = this.state.surveyid;
  //   let option = this.state.treatmentOptionID;
  //   let comments = this.state.comments;
  //
  //   let lastOption = this.state.lastTreatmentOptionID;
  //   let lastComments = this.state.lastComments;
  //
  //   // don't submit if there's no change from last submission attempt
  //   if ((option === lastOption) && (comments === lastComments)){
  //     return;
  //   }
  //
  //   if (option || comments){
  //     console.log("Auto-saving draft");
  //     await api.saveEosDraft(eos_id, option, comments, expert_id);
  //     this.setState({lastTreatmentOptionID: option, lastComments: comments});
  //   }
  // }

  // submitSurveyform = async () => {
  //
  //   if(window.localStorage.getItem('is_in_debug_mode') == 1) {
  //     await Plugins.Modals.alert({title: getAlertTitle(), message: "You can't respond in debug mode"});
  //     return;
  //   }
  //
  //   this.error = false;
  //   let treatmentOptionID = this.state.treatmentOptionID;
  //   let comments = this.state.comments;
  //
  //   console.log('treatmentOptionID : ',this.state.treatmentOptionID);
  //   console.log('comments : ',this.state.comments);
  //   console.log('****'); /* test-comment to trigger expert-app build */
  //
  //   if (treatmentOptionID || comments) {
  //     this.error = false;
  //
  //     if (comments !== '') {
  //       comments = comments.replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
  //     }
  //   } else {
  //       this.error = true;
  //       this.errorMessage = 'Please select an option or leave a comment.';
  //   }
  //
  //   if(!this.error) {
  //       let respondedQuestions = Object.keys(this.state.prospectiveTrialAnswers);
  //       let allQuestions = this.state.prospectiveTrialQuestionIDs;
  //       if(!(_.isEqual(respondedQuestions.sort(), allQuestions.sort()))){
  //           console.log('no response');
  //           this.error = true;
  //           this.errorMessage = 'Please complete the questionnaire.';
  //       }
  //   }
  //
  //   if (this.error) {
  //     this.setState({
  //       showLoading: false,
  //       showAlert: true,
  //       alertMessage: this.errorMessage
  //     });
  //   } else {
  //     this.error = false;
  //     this.setState({
  //       showLoading: true,
  //       loadingMessage: "Submitting"
  //     }, () => {
  //       this.postData(treatmentOptionID, comments);
  //     });
  //   }
  // }

  // postData = async (option, comments) => {
  //
  //   let prosp_trial = JSON.stringify(this.state.prospectiveTrialAnswers);
  //
  //   let expert_id = LocalCache.get('expertid'); // TODO: grab from state if possible, this may be a vulnerability
  //   let eos_id = this.state.surveyid;
  //
  //   globalVars.setIsSurveySubmitInProgress(true);
  //
  //   const data = await api.eosResponse(eos_id, option, comments, prosp_trial, expert_id);
  //
  //   globalVars.setIsSurveySubmitInProgress(false);
  //
  //   try {
  //     if (data && data.error) {
  //         this.setState({
  //           showAlert: true,
  //           showLoading: false,
  //           loadingMessage: null,
  //           alertMessage: data.error
  //         });
  //     } else {
  //       // Update tracking details for the survey once response is submitted.
  //       // this.analyticsTracking(false);
  //       this.surveyDetailsAnalyticsTracking(false, {}, {}, true);
  //
  //       // This function resets few analytics entries. Don't change its call location before proper testing.
  //       this.resetTrackingDetails();
  //
  //       this.setState({
  //         showLoading: false
  //       }, () => {
  //         this.setState({
  //           showLoading: true,
  //           loadingMessage: 'Thank you for your response. Loading your next survey'
  //         }, async () => {
  //
  //           const resp = await api.getNextSurveyID();
  //           setTimeout(() => {
  //             if (resp && resp.data)
  //               this.showNextSurveypage(resp.data.survey_id);
  //             else {
  //               this.cancelBtnClicked = true;
  //               this.setState({
  //                 isOpen: false,
  //                 surveyid: null,
  //                 expertHTML: null,
  //                 showLoading: false,
  //                 loadingMessage: null
  //               }, () =>  {
  //                 window.location = window.location.origin + `/user/home`;
  //               });
  //             }
  //           }, 1500);
  //         });
  //       });
  //     }
  //   } catch(e) {
  //     this.setState({
  //       showLoading: false,
  //     });
  //   }
  // }

  // showNextSurveypage = (survey_id) => {
  //   globalVars.clearSurveysTab();
  //   if (isAndroid())
  //     window.location = window.location.origin + `/user/surveys/${survey_id}`;
  //   else {
  //     this.props.history.push(`/user/surveys/${survey_id}`);
  //   }
  // }

  // validateTokenCall = async () => {
  //
  //   const accessToken = localStorage.getItem('token');
  //
  //   let postData = { userid: localStorage.getItem('userid') };
  //
  //   if (!!accessToken) {
  //     postData = {...postData, access_token: accessToken};
  //   }
  //
  //   const response = await api.validateToken(postData);
  //
  //   console.log('validateTokenCall');
  //   console.log(response);
  //
  //   if(response && response.success) {
  //     return true;
  //   }
  //   return false;
  // }

  // getLocationSearchParams() {
  //   const locationSearch = globalVars.getURILocationSearch();
  //   if(locationSearch && locationSearch.indexOf('survey_token') > -1) {
  //     return locationSearch;
  //   } else {
  //     let surveyToken = getQueryVariable('survey_token');
  //     let surveyID = getQueryVariable('survey_id');
  //     let org = getQueryVariable('org');
  //
  //     if (surveyToken && surveyID) {
  //       return `survey_token=${surveyToken}&survey_id=${surveyID}&org=${org}`;
  //     }
  //
  //     return null;
  //   }
  // }

  // validateTokencallIfSurveyTokenInURL = async () => {
  //   const locationSearch = this.getLocationSearchParams();
  //   if (locationSearch) {
  //     const result = await this.validateTokenCall();
  //     globalVars.setURILocationSearch(null);
  //
  //     if (result) {
  //       await this.showSurveyDetailsSection();
  //     } else {
  //       const tokenManager = new TokenManager();
  //       tokenManager.clearToken();
  //       window.location = `/login?${locationSearch}`;
  //     }
  //   } else {
  //     await this.showSurveyDetailsSection();
  //   }
  // }

  async ionViewWillEnter() {
    console.log('ionViewWillEnter');
    const info = await Plugins.Device.getInfo();
    this.deviceInfo = {...info};
    this.nonAndroidPlatforms = ['ios', 'web'];

    if (this.componentLoaded) return true;
    this.cancelBtnClicked = false;
    document.title = `Survey ${this.props.match.params.eosid}`;
    // validate token call only when survey token is present and if loggedin
    globalVars.setIsSurveySubmitInProgress(false);
    // await this.validateTokencallIfSurveyTokenInURL();
    await this.showSurveyDetailsSection();
  }

  surveyLoadSuccessCb = async () => {
    showUpdateInfoPopup();
    if (this.serverSurveyResponse) {
      this.addClickListenersOnLinks();
    }
  }

  renderSurvey = (surveyResponse) => { 

    const { eosid, medicalcaseid } = this.props.match.params;

    let heading = <div />;
    heading = <div className="sub-heading-section multi-column"><div>Survey ID: {eosid}</div><div>Medical Case ID: {medicalcaseid}</div></div>;

    let surveyHTML = surveyResponse.survey;

    const referrer = localStorage.getItem('referrer');
    let referrerCSS = avatarStyles[referrer] || avatarStyles['navya'];

    surveyHTML = surveyHTML.replace(/(#D7D6D8)/g, '#737373');
    surveyHTML = surveyHTML.replace(/(&nbsp;)/g, ''); // delete extra space at the beginning of lines in a class
    surveyHTML = surveyHTML.replace(/(#b657a0)/g, referrerCSS.color);
    if (referrer.toLowerCase() === 'mskcc' || referrer.toLowerCase() === 'pm' || referrer.toLowerCase() === 'accesshope') {
      surveyHTML = surveyHTML.replace(/(#542877)/g, '#000');
    }

    const question = <div className="card" dangerouslySetInnerHTML={{ __html: surveyHTML }} />;

    return [heading, question];
  }

  showSurveyDetailsSection = () => {

    this.setState({
      showLoading: true,
      loadingMessage: '',
      isOpen: true
    }, async () => {

      const surveyid = this.props.match.params.eosid
      const caseid = this.props.match.params.medicalcaseid;

      try {
        let expertHTMLData = null;
        let checkForNextSurvey = false;
        this.serverSurveyResponse = false;
        const surveyResponse = await api.getAlphaSurveyPreview(surveyid, caseid);
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

      } catch(e) {
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

    if (this.deviceInfo.platform !== 'web') {
      if (document.getElementById('txtcomments')) {
        document.getElementById('txtcomments').removeEventListener('focus', this.hideBottomBarOnFocus);
        document.getElementById('txtcomments').removeEventListener('blur', this.hideBottomBarOnBlur);
      }
    }
  }

  showSurveysMain = () => {
    this.cancelBtnClicked = true;
    this.setState({
      isOpen: false,
      expertHTML: null
    }, () =>  {
      this.props.history.push('/user/surveys');
    });
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

  render() {

    let attachmentContainerWidth = 400;
    let attachmentContainerHeight = 700;

    // console.log('attachment container size')
    const size = this.getAttachmentContainerSize();
    if(size) {
      attachmentContainerWidth = size[0];
      attachmentContainerHeight = size[1];
    }

    const isMobile = isSmallScreen();

    return (
      <React.Fragment>
        <Modal
        isOpen={this.state.isOpen}
        enterAnimation={slideInHorizontalLeft}
        leaveAnimation={slideOutHorizontalRight}
        className={'survey-details-modal-container'}>
        <IonPage className="survey-details-container">
          <Header title={`Survey ${this.props.match.params.eosid}`} >
            <ion-icon class="close-btn" name="arrow-back" onClick={() => this.showSurveysMain()}></ion-icon>
          </Header>
            <IonContent className="survey-content-section"  scrollEvents={true}>
             {
               this.state.expertHTML &&
               
                  <div className="surveys-data">
                   
                    {this.state.expertHTML}
                  </div>
             }
             </IonContent>


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

        </IonPage>
        </Modal>

      </React.Fragment>
    );
  }
}

export default withRouter(withIonLifeCycle(AlphaSurveyPreviewDetails));
