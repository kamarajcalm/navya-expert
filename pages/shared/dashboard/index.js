import React from 'react';
import {IonAlert, IonPage} from '@ionic/react';
import { Header, Tabs } from '../../../common';
import ExpertSurveyListDashboard from './pages/expert_survey_list';
import ExpertListDashboardTMH from './pages/expert_list_tmh';
import ExpertListDashboardMSKCC from './pages/expert_list_mskcc';
import HospitalSummaryDashboardMSKCC from './pages/hospital_summary_mskcc';
import CaseAggregatedListDashboard from './pages/cases_aggregated_list';
import {isSmallScreen} from "../../../utils";
import { isMSKCC, isPM, isAccessHope } from '../../../referrers';
import localCache from '../../../api/localCache';
import './styles.scss';

class Dashboard extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      showMobileAlert: false
    };
  }

  componentDidMount() {
    document.title = "Dashboard";
    if(isSmallScreen()) {
      let show_mobile_alert = localCache.get('show_mobile_alert');
      if (!show_mobile_alert) {
        this.setState({showMobileAlert: true})
      }
    }
  }

  getDashhboardTabs() {
      let tabList = [];
      if(isMSKCC()) {
    tabList = [
      {
        tabLabel: {
          name: "Surveys"
        },
        tabDataComponent: {
          name: ExpertSurveyListDashboard,
          props: {
            currentTabIndex: 0,
            parentTabIndex: 0,
            isSubTab: 0,
            delegateHandle: 'perf-scroll'
          }
        },
        tabContentClass: 'dashboard-container'
      },
      {
        tabLabel: {
          name: "Experts"
        },
        tabDataComponent: {
          name: ExpertListDashboardMSKCC,
          props: {
            currentTabIndex: 0,
            parentTabIndex: 1,
            isSubTab: 0,
            delegateHandle: 'perf-scroll'
          }
        },
        tabContentClass: 'dashboard-container'
      },
      {
        tabLabel: {
          name: "Summary"
        },
        tabDataComponent: {
          name: HospitalSummaryDashboardMSKCC,
          props: {
            currentTabIndex: 0,
            parentTabIndex: 2,
            isSubTab: 0,
            delegateHandle: 'perf-scroll'
          }
        },
        tabContentClass: 'dashboard-container'
      }
    ];
} else if (isPM() || isAccessHope()){
    tabList = [{
      tabLabel: {
        name: isAccessHope() ? "Cases" : "Surveys"
      },
      tabDataComponent: {
        name: ExpertSurveyListDashboard,
        props: {
          currentTabIndex: 0,
          parentTabIndex: 0,
          isSubTab: 0,
          delegateHandle: 'perf-scroll'
        }
      },
      tabContentClass: 'dashboard-container'
    },
    {
      tabLabel: {
        name: "Experts"
      },
      tabDataComponent: {
        name: ExpertListDashboardMSKCC,
        props: {
          currentTabIndex: 0,
          parentTabIndex: 1,
          isSubTab: 0,
          delegateHandle: 'perf-scroll'
        }
      },
      tabContentClass: 'dashboard-container'
    },
    {
      tabLabel: {
        name: "Summary"
      },
      tabDataComponent: {
        name: HospitalSummaryDashboardMSKCC,
        props: {
          currentTabIndex: 0,
          parentTabIndex: 2,
          isSubTab: 0,
          delegateHandle: 'perf-scroll'
        }
      },
      tabContentClass: 'dashboard-container'
    }
  ];
} else {
    tabList = [
        {
          tabLabel: {
            name: "Cases"
          },
          tabDataComponent: {
            name: CaseAggregatedListDashboard,
            props: {
              currentTabIndex: 0,
              parentTabIndex: 0,
              isSubTab: 0,
              delegateHandle: 'perf-scroll'
            }
          },
          tabContentClass: 'dashboard-container'
        },
      {
        tabLabel: {
          name: "Surveys"
        },
        tabDataComponent: {
          name: ExpertSurveyListDashboard,
          props: {
            currentTabIndex: 0,
            parentTabIndex: 1,
            isSubTab: 0,
            delegateHandle: 'perf-scroll'
          }
        },
        tabContentClass: 'dashboard-container'
      },
      {
        tabLabel: {
          name: "Experts"
        },
        tabDataComponent: {
          name: ExpertListDashboardTMH,
          props: {
            currentTabIndex: 0,
            parentTabIndex: 2,
            isSubTab: 0,
            delegateHandle: 'perf-scroll'
          }
        },
        tabContentClass: 'dashboard-container'
      }
    ];
}
    return tabList;
  }

  hideMobileAlert() {
    this.setState({showMobileAlert: false})
  }

  hideMobileAlertPermanently() {
    localCache.set("show_mobile_alert", false)
  }

  settingsClick = async () => {
    this.props.history.push('/user/settings');
  }

  render() {

    const tabList = this.getDashhboardTabs();

    return (
      <IonPage>
          <Header title="Dashboard" />
          <Tabs
            wrapperClass="dashboard-tabs"
            tabObj={{currentTabIndex:0, parentTabIndex:0, isSubTab: 0}}
            data={tabList}
            type="Dashboard"
          />
          {this.state.showMobileAlert && <IonAlert
            isOpen={this.state.showMobileAlert}
            message={"This view is not optimized for mobile. We recommend you view on desktop.<br/><br />Dismiss to not see this message again."}
            buttons={[
              {
                text: 'OK',
                handler: () => {
                  this.hideMobileAlert();
                }
              },
              {
                text: "DISMISS",
                handler: () => {
                    this.hideMobileAlertPermanently();
                }
              }
            ]}
          />
          }
      </IonPage>
    );
  }
}

export default Dashboard;
