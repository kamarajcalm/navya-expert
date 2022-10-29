
import React from 'react';
import { IonPage, withIonLifeCycle } from '@ionic/react';
import { withRouter } from 'react-router-dom';
import { Header, Tabs } from '../../../common';
import globalVars from '../../../globalVars';
import getStubForHome from '../../../stubs/home';
import SurveysData from './surveysdata';
import SurveysSearch from './surveysearch';
import { isAccessHope } from '../../../referrers';
import { getTabSubTabData } from '../../../utils';
import './styles.scss';

class SurveysComponent extends React.PureComponent {

  constructor(props) {
    super(props);
  }

  cbComponentTabs = (params) => {

    const {
      isSubTab, pIndex, cIndex, item
    } = params;

    return {
      tabLabel: {
        name: item.label,
        class: `color-${item.label.toLowerCase()}`
      },
      tabDataComponent: {
        name: SurveysData,
        props: {
          currentTabIndex: cIndex,
          parentTabIndex: pIndex,
          label:item.key?item.key.toLowerCase():"",
          isSubTab,
          infiniteScrollID: 'infinite-scroll',
          type: 'default'
        }
      },
      tabContentClass: 'survey-list-container'
    };
  }

  getSurveysTabsList() {
    const homeStub = getStubForHome();
    const data = getTabSubTabData({
      stubArray: homeStub, cbFn: this.cbComponentTabs
    }).map((item, index) => {
      if (item.constructor.name === "Array") {
        const parentTabIndex = item[0].tabDataComponent.props.parentTabIndex;
        const homeIndexObj = homeStub[parentTabIndex];
        return {
          tabLabel: {
            name: homeIndexObj.label,
            class: `color-${homeIndexObj.label.toLowerCase()}`
          },
          subTabs: item
        }
      }
      return item;
    });

    return data;
  }

  ionViewDidEnter() {
    window.alertShownCounter = 0;
    document.title = isAccessHope() ? "Cases" : "Surveys";
  }

  render() {
    const surveysTabList = this.getSurveysTabsList();
    const tabObj = globalVars.getSurveysTab() || globalVars.getDefaultSurveysTab();

    return (
      <IonPage className="surveys-page-container">
          <Header title={isAccessHope() ? 'Cases' : 'Surveys'}>
            { !isAccessHope() && <SurveysSearch classNameValue="survey-search" /> }
          </Header>
          <Tabs
            wrapperClass="surveys-tabs"
            tabObj={tabObj}
            data={surveysTabList}
            type="surveys"
          />

      </IonPage>
    )
  }
}

export default withRouter(withIonLifeCycle(SurveysComponent));
