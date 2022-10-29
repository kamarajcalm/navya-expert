
import React from 'react';
import { IonLoading, IonCard } from '@ionic/react';
import WeeklyData from './weeklydata';
import ComparisonCharts from './comparisoncharts';
import '../styles.scss';

class PersonnalTab extends React.PureComponent {

  constructor(props) {
    super(props);
    this.loaderCount = 0;
    this.state = {
      showLoader: true,
      xeTime: null
    }
  }

  updateLoaderCount = (xeTime=null) => {
    this.loaderCount++;
    if (this.loaderCount === 2) {
      this.setState({
        showLoader: false,
        xeTime: isNaN(xeTime) ? null : xeTime
      })
    }
  }

  getHoursFromMinutes = (xeTime) => {
    if (!xeTime) return '';
    let xeTimeLocal = xeTime > 60 ? xeTime / 60 : xeTime;
    const isDecimal = (xeTimeLocal - Math.floor(xeTimeLocal)) !== 0;
    xeTimeLocal = isDecimal ? xeTimeLocal.toFixed(1) : xeTimeLocal;
    let time = xeTime > 60 ? xeTimeLocal + ' hours' : xeTimeLocal + ' minutes';
    return time;
  }

  render() {
    return (
      <React.Fragment>
          <WeeklyData updateLoaderCount={this.updateLoaderCount} />
          <ComparisonCharts updateLoaderCount={this.updateLoaderCount} />
          {
            this.state.xeTime ?
            <IonCard className="xe-content">Time contributed to the Experience engine in the last 4 weeks: {this.getHoursFromMinutes(this.state.xeTime)}</IonCard> : ''
          }
          <IonLoading isOpen={this.state.showLoader} />
      </React.Fragment>
    );
  }
}

export default PersonnalTab;
