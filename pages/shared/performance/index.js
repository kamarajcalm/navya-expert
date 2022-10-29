
import React from 'react';
import { IonPage, withIonLifeCycle } from '@ionic/react';
import { withRouter } from 'react-router-dom';
import { Header, Tabs } from '../../../common';
import Comparison from './comparison';
import Personal from './personal';
import './styles.scss';

class PerformanceComponent extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      showPageTitle: false
    }
  }

  getPerformanceTabsList() {

    const performanceTabList = [
      {
        tabLabel: {
          name: "Personal",
          class: 'Personal',
        },
        tabDataComponent: {
          name: Personal,
          props: {
            currentTabIndex: 0,
            parentTabIndex: 0,
            isSubTab: 0,
            delegateHandle: 'perf-scroll',
            componentGetData: this.personalGetData
          }
        }
      },
      {
        tabLabel: {
          name: "Comparison",
          class: 'comparison-label',
        },
        tabDataComponent: {
          name: Comparison,
          props: {
            currentTabIndex: 0,
            parentTabIndex: 1,
            isSubTab: 0,
            delegateHandle: 'perf-scroll',
            componentGetData: this.comparisonGetData
          }
        }
      }
    ];
    return performanceTabList;
  }

  ionViewDidEnter() {
    window.alertShownCounter = 0;
    document.title = "Performance";
  }

  render() {

    const performanceTabList = this.getPerformanceTabsList();

    return (
      <IonPage>
          <Header title={'Performance'} />
          <Tabs
            wrapperClass="performance-tabs"
            tabObj={{currentTabIndex:0, parentTabIndex:0, isSubTab: 0}}
            data={performanceTabList}
            type="settings"
          />

      </IonPage>
    )
  }
}

export default withRouter(withIonLifeCycle(PerformanceComponent));
