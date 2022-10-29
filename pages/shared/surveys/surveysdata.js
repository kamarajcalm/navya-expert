
import React from 'react';
import {
  IonList, IonItem, IonImg,
  IonContent, IonRefresher, IonRefresherContent,
  IonLoading
} from '@ionic/react';
import globalVars from '../../../globalVars';
import { isMSKCC, isPM, isAccessHope } from '../../../referrers';
import { navyaLogo, mskccLogo, pmLogo, accessHopeLogo } from '../../../assets/images';
import api from '../../../api/endpoints';
import { withRouter } from 'react-router-dom';
import {
  isAndroid, getReferrer, surveyTabConstants, isDebug,
  getLocalDateTime, getDateSuffix, getNumberOfDaysFromToday,
  addZeroPrefix, getSurveyType, isWeb
} from '../../../utils';
import { getLogos } from '../../../stubs/logo';
import './styles.scss';
import AcesshopeCase from './accesshopeCase';

class SurveysData extends React.PureComponent {

  constructor(props) {

    super(props);

    this.constants = { ...globalVars.getSurveyTabConstants() };

    this.state = {
      dataList: [],
      showLoading: false,
      selectedEosId: null,
      selectedEosIdNext: null,
      dataLoaded: false
    };

    this.monthMap = {
      "January": "Jan", "February": "Feb", "March": "Mar", "April": "Apr",
      "May": "May", "June": "Jun", "July": "Jul", "August": "Aug",
      "September": "Sep", "October": "Oct", "November": "Nov", "December": "Dec"
    };

    this.monthMapFull = Object.keys(this.monthMap);

    this.monthMapNumber = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    this.dataListCount = 0;

  }







  AHapiMapList = () => {
    return {
      'priority': { 'url':  'eosExpertview', 'status': 'invited' },
      'new': { 'url':  'eosExpertview', 'status': 'pending' },
      'overdue': { 'url':  'eosExpertview', 'status': '' },
      'qc': { 'url':  'eosExpertQcview', 'status': 'pending' },
      'xe': { 'url':  'eosExpertviewXE' },
      'done': { 'url':  'eosExpertview', 'status': 'completed' }
    }
  }
   apiMapList = () => {
    return {
      'priority': { 'url':  'eosExpertviewp', 'status': 'pending' },
      'new': { 'url':  'eosExpertview', 'status': 'pending' },
      'overdue': { 'url':  'eosExpertview', 'status': '' },
      'xe': { 'url':  'eosExpertviewXE' },
      'done': { 'url':  'eosExpertview', 'status': 'completed' }
    }
  }


  componentGetData = async(pull=false) => {

    try {
      this.surveyType = getSurveyType();
      const obj  = isAccessHope() ? this.AHapiMapList()[this.surveyType] : this.apiMapList()[this.surveyType]
      const survey_data = await api[obj.url](this.pageNum, obj.status, this.props.searchKey, isDebug());
      this.dataListCount = (survey_data && survey_data.count) || 0;
      const respData = (survey_data && survey_data["0"]) || [];

      this.setState({
        dataList: ((pull || this.pageNum === 1) ? respData : [...this.state.dataList, ...respData]) || []
      });
      this.setState({
        dataLoaded: true
      })
    } catch(e) {
      console.log(e);
      this.setState({
        showLoading: false
      });
    }

  }

  getInitData = async () => {

    this.setState({
      showLoading: true
    }, async () => {
      this.infiniteScrollContent();
      this.pageNum = 1;
      try {

        await this.componentGetData();
        this.setState({
          showLoading: false
        });
      } catch(e) {
        console.log(e.message);

        this.setState({
          showLoading: false
        });
      }
    });
  }

  componentDidMount = async() => {

    if (this.props.type === 'default') {
      await this.getInitData();
    } else {
      if (this.props.type === 'search') {
        this.infiniteScrollContent();
      }

    }

  }

  componentDidUpdate = async (prevProps, prevState) => {
    if (this.props.type === 'search') {
      if (this.props.searchKey !== '' && this.props.searchKey !== prevProps.searchKey) {
        await this.getInitData();
      } else if (this.props.searchKey === '' && this.props.searchKey !== prevProps.searchKey) {
        // debugger;
        this.setState({
          dataList: []
        });
      }
    }
    const isRefreshTable=sessionStorage.getItem('resfresh_survey_table')
    if(isRefreshTable){
      sessionStorage.removeItem('resfresh_survey_table')
      await this.getInitData();
    }
  }

  infiniteScrollContent = () => {
    const infiniteScroll = document.getElementById(this.props.infiniteScrollID);
    infiniteScroll.addEventListener('ionInfinite', this.infiniteScrollEvent);
  }

  infiniteScrollEvent = event => {
      // debugger;
      setTimeout(async () => {
        this.pageNum += 1;
        await this.componentGetData();
        event.target.complete();
        // App logic to determine if all data is loaded
        // and disable the infinite scroll
        if (this.state.dataList.length === this.dataListCount) {
          event.target.disabled = true;
        }
      }, 500);
  }

  componentWillUnmount() {
    if (this.props.infiniteScrollID && document.getElementById(this.props.infiniteScrollID)) {
      document.getElementById(this.props.infiniteScrollID).removeEventListener('ionInfinite', this.infiniteScrollEvent);
    }
  }

  pullToRefresh = (event) => {
    setTimeout(async () => {
      this.pageNum = 1;
      await this.componentGetData(true);
      event.detail.complete();
    }, 1000);
  }

  showSurveyDetails = (item) => {
    if (this.props.type === 'search') {
      this.props.toggleSearchModal();
    }
    // if (isAndroid())
    //   window.location = window.location.origin + `/user/surveys/${item.EO_SurevyID}`;
    // else
      
      this.props.history.push(`/user/surveys/${item.EO_SurevyID}`);

  }

  getSurveyRespondedDay = (day) => {
    let localDay = new Date(day.replace(' ', 'T') + '.000Z');
    const fullYear = localDay.getFullYear();
    const currentFullYear = new Date().getFullYear();
    const date = localDay.getDate();
    const month = localDay.getMonth();
    const hours = addZeroPrefix(localDay.getHours());
    const minutes = addZeroPrefix(localDay.getMinutes());
    if (date)
      return `${date} ${this.monthMapNumber[month]} ${fullYear !== currentFullYear ? fullYear + ',': ''} ${hours}:${minutes}`;
    return null;
  }

  getLoggedInMSKCCLogos = () => {
    return [
      {
        src: navyaLogo,
        alt: 'navya-logo'
      },
      {
        src: mskccLogo,
        alt: 'mskcc-logo'
      }
    ]
  }

  getLoggedInPMLogos = () => {
    return [
      {
        src: navyaLogo,
        alt: 'navya-logo'
      },
      !isWeb() && {
        src: pmLogo,
        alt: 'pm-logo'
      }
    ]
  }

  getLoggedInAccessHopeLogos = () => {
    return [
      {
        src: accessHopeLogo,
        alt: 'accesshope-logo'
      }
    ]
  }

  getLocalSurveySentDate = (localDate) => {
    if (localDate === '') return '';
    let date = localDate.split(' ')[0].split('-');
    return `${getDateSuffix(date[2] * 1)} ${this.monthMapFull[date[1] * 1 - 1]}`;
  }

  getEmptySurveysMessage = () => {

    if (!this.surveyType) return;

    let emptySurveysMessageObj = {
      'priority': 'You have reviewed all summaries that were marked as a priority. Thank you.',
      'new': 'You have reviewed all summaries sent today. Thank you.',
      'overdue': 'You have reviewed all summaries that were overdue. Thank you.',
      'xe': 'You have reviewed all Experience Engine summaries. Thank you.',
      'done': 'You have not reviewed any summaries yet.'
    };

    if(isAccessHope()){
      emptySurveysMessageObj = {
        'priority': 'You have no open invitations.',
        'new': 'You have no pending case reviews.',
        'overdue': 'You have no pending case reviews.',
        'xe': 'You have no pending case reviews.',
        'qc': 'You have no pending QC case reviews.',
        'done': 'You have not reviewed any cases yet.'
      };
    }

    return ( <h1>{emptySurveysMessageObj[this.surveyType]}</h1> );

  }

  render() {

    const {currentTabIndex, parentTabIndex, isSubTab,infiniteScrollID, searchKey='', type="default",label} = this.props;

    const { dataList } = this.state;
    console.log("sample",this.props)
    const logos = getLogos() || [];
    const logosStub = isMSKCC() ? this.getLoggedInMSKCCLogos() : isPM() ? this.getLoggedInPMLogos() : isAccessHope() ? this.getLoggedInAccessHopeLogos() : logos;
    return (
      <React.Fragment>
         {/* {!isAccessHope()?(
           <>
           <AcesshopeCase />

           </>
         ):( */}
           <>
           <IonRefresher slot="fixed" onIonRefresh={this.pullToRefresh} >
          <IonRefresherContent
            pullingText="Pull to refresh"
            refreshingSpinner="lines"
            refreshingText="Refreshing..."
            pullingIcon="ion-android-arrow-down">
          </IonRefresherContent>
        </IonRefresher>
        
        {
          dataList && dataList.length > 0  ? (
            <React.Fragment>
              {isAccessHope()?(<>
              <AcesshopeCase label={label} data={dataList} goToSurveyDetail={(item) => this.showSurveyDetails(item)} recall={()=>this.getInitData()} />
              </>):
              ( <>
                <IonList className={parentTabIndex==3 ? '' : ''}>
                  {
                    dataList.map((item, index) => {

                      const {
                        gender, Age, Date_survey_sent, clinical_diagnosis, EO_SurevyID,
                        Date_survey_responded=null,
                        Date_survey_sent_Datetime=""
                      } = item;

                      const surveyResponded = parentTabIndex==3 && Date_survey_responded ? this.getSurveyRespondedDay(Date_survey_responded) : null;
                      const numOfOverdueDays = Date_survey_sent_Datetime ? getNumberOfDaysFromToday(Date_survey_sent_Datetime.replace(' ','T') + '.000Z') : '';
                      return (

                        <IonItem
                          className={`survey-item ${isDebug() ? 'debug' : null} ${item.expert_viewed_at ? 'debug-data' : null}`}
                          key={`${this.surveyType}_${index}`}
                          onClick={() => this.showSurveyDetails(item)}
                        >
                         <div className="survey-item-meta">
                            {gender && <i className={`navya-icon-${gender.toLowerCase()}`} />}
                            {Age && <span className="icon-number">{Age}</span>}
                          </div>
                          <div className="survey-item-info">
                            {Date_survey_sent && <div className="primary date-survey-sent">{this.getLocalSurveySentDate(getLocalDateTime(Date_survey_sent_Datetime))}</div>}
                            {clinical_diagnosis && <div className="secondary clinical-diagnosis">{clinical_diagnosis}</div>}
                            {EO_SurevyID && <div className="secondary survey-id"><span className="survey-id-label">ID: </span><span className="survey-id-value">{EO_SurevyID.toString()}</span></div>}
                            {parentTabIndex !== 3 && Date_survey_sent_Datetime !== "" && numOfOverdueDays !== "" && <span className="badge1 survey-due-days">{numOfOverdueDays}</span>}

                            {parentTabIndex === 3 && surveyResponded !== 0 && surveyResponded !== null && <span className="badge1 survey-due-days">{surveyResponded}</span> }


                            {
                              isDebug() && (
                                <React.Fragment>
                                  {parentTabIndex === 2 && item.is_xe == 1 && <span className="badge survey-due-days">XE</span>}
                                  <div className="viewed-submitted-status">
                                    {item.expert_viewed_at && <span>Viewed at: {getLocalDateTime(item.expert_viewed_at)}</span>}
                                    {item.expert_viewed_source && <span> Viewed Source: {item.expert_viewed_source}</span>}
                                    {item.Date_survey_responded && parentTabIndex !== 3 && <span> Responded at: {getLocalDateTime(item.Date_survey_responded)}</span>}
                                  </div>
                                </React.Fragment>
                              )
                            }
                          </div>
                        </IonItem>

                      );
                    })
                  }
              </IonList>
              </>)}

            </React.Fragment>

          ) : (
              <React.Fragment>
              { this.state.dataLoaded && !this.props.suppressMessage &&
                <IonContent scrollEvents={true}>
                { this.getEmptySurveysMessage() }
                  <div className="bottom-logo-container">
                  {
                    logosStub.map((logo, index) => {
                      return (
                        <>
                        {
                          logo ? (
                            <IonImg
                              className="bottom-logo"
                              src={logo.src}
                              alt={logo.alt}
                            />
                          ) : null
                        }
                        </>
                      )
                    })
                  }
                  </div>
                </IonContent>
              }
              {
                this.state.dataLoaded && this.props.suppressMessage && this.props.noResultsMessage &&
                <div className="no-results-container">{this.props.noResultsMessage}</div>
              }
              </React.Fragment>
          )
        }

        <ion-infinite-scroll threshold="5%" id={infiniteScrollID}>
          <ion-infinite-scroll-content
            loading-spinner="lines"
            loading-text="Loading more data...">
          </ion-infinite-scroll-content>
        </ion-infinite-scroll>
        <IonLoading isOpen={this.state.showLoading} />

           </>
         {/* )} */}




      </React.Fragment>
    );
  }
}

export default withRouter(SurveysData);
