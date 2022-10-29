
import React from 'react';
import cx from 'classnames';
import { IonContent, IonHeader, IonLoading } from '@ionic/react';
import { withRouter } from 'react-router-dom';
import './styles.scss';
import globalVars from '../../globalVars';

const TabLabel = (props) => {
  let tabDataComponentProps;
  if (props.item.subTabs) {
    tabDataComponentProps= props.item.subTabs[0].tabDataComponent.props
  } else {
    tabDataComponentProps = props.item.tabDataComponent.props;
  }
  const {
    currentTabIndex, parentTabIndex, isSubTab
  } = tabDataComponentProps || {};

  const {
    currentTabIndex: selCurrentTabIndex,
    parentTabIndex: selParentTabIndex,
    isSubTab: selIsSubTab
  } = props.selectedTab;

  const isActive = selParentTabIndex === props.index || (selIsSubTab && selCurrentTabIndex === props.subIndex);

  return (
    <span
      data-val={props.dataVal}
      className={cx(`tab-label ${props.item.subTabs ? 'sub-tab-label' : ''} ${props.item.tabLabel.class || ''}`, {'active': isActive})}
      onClick={(e) => props.setCurrentTab({currentTabIndex, parentTabIndex, isSubTab}, e)}
      key={`tabs_${props.item.tabLabel.name}_${props.index}`}
      style={{
        'width': `${(100/props.dataLength).toFixed(2)}%`
      }}
    >
      {props.item.tabLabel.name}
      {props.children}
    </span>
)};

class Tabs extends React.PureComponent {

  constructor(props) {
    super(props);
    const tabObj = this.props.tabObj;
    this.state = {
      currentTabIndex: tabObj.currentTabIndex || 0,
      isSubTab: tabObj.isSubTab || 0,
      parentTabIndex: tabObj.parentTabIndex || 0
    }
  }

  setCurrentTab = (tabObj, event) => {
    console.log('setCurrentTab in Tabs');
    if (event && tabObj.isSubTab) event.stopPropagation();
    if (Object.keys(tabObj).length === 0) return;
    this.setState({
      ...tabObj
    }, () => {
      if (this.props.type) {
        if (this.props.type === 'surveys') {
          globalVars.setSurveysTab({...tabObj});
        }
      }
      this.props.componentGetData && this.props.componentGetData();
    });
  }

  componentDidUpdate(prevProps, prevState) {
    const cTabObj = this.state.tabObj || {};
    const prevData = prevState;
    const pTabObj = prevData;

    if (cTabObj.parentTabIndex !== pTabObj.parentTabIndex ||
      pTabObj.isSubTab !== cTabObj.isSubTab ||
      pTabObj.currentTabIndex !== cTabObj.currentTabIndex) {
      this.setCurrentTab(cTabObj);
    }
  }

  getTabHeaders = (data, subTabHeaders=false) => {
    const {
      currentTabIndex, parentTabIndex, isSubTab
    } = this.state;
    return (
      <IonHeader>
      {
        data.map((item, index) => (
          <TabLabel
            key={`survey_${item.tabLabel.name}`}
            dataVal={`survey_${item.tabLabel.name}`}
            item={item}
            selectedTab={{currentTabIndex, parentTabIndex, isSubTab}}
            index={index}
            subIndex={subTabHeaders ? index : null}
            setCurrentTab={this.setCurrentTab}
            dataLength={data.length}
          >
            { item.subTabs && this.getTabHeaders(item.subTabs, true) }
          </TabLabel>
        ))
      }
      </IonHeader>
    );
  }

  getTabData = (data, tabIndex, subTabFlag=false) => {

    const tabData = data.map((item, index) => {
      if (tabIndex === index) {
        if (item.subTabs) {
          return this.getTabData(item.subTabs, this.state.currentTabIndex, true);
        }

        const tDComp = item.tabDataComponent;
        return (
          <IonContent key={`page_${index}`} className={cx(`${item.tabContentClass || ''}`, {'subtab': !!subTabFlag})} scrollEvents={true}>
            <tDComp.name
              {...tDComp.props}
            />
          </IonContent>
        );
      }
      return null;
    });

    return tabData;
  }

  render() {
    let {
      tabs, wrapperClass, tabObj, data, tabLabelClass='', tabContentClass=''
    } = this.props;

    // const selectedTabIndex = this.state.isSubTab ? this.state.currentTabIndex :  this.state.parentTabIndex;
    //
    // if (this.state.isSubTab) {
    //   data = data[this.state.parentTabIndex].subTabs
    // }

    return (
      
      <div className={`tabbed-interface ${wrapperClass}`}>
        
        {this.getTabHeaders(data)}
        {this.getTabData(data, this.state.parentTabIndex)}
        
      </div>
    );
  }
}

export default withRouter(Tabs);
