
// Update data to compare expert's performance
// from the last month to their all-time data.

import React from 'react';
import { withIonLifeCycle } from '@ionic/react';
import Helper from '../helpers';
import ComparisonCard from '../comparisoncard';

class ComparisonCharts extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      pieChartState: [...Helper.compareSelfSets]
    }
  }

  async getPersonalComparisonCharts() {

    try {
      let defaultComparionSets = Helper.defaultComparisonSets();
      let user = defaultComparionSets.user;
      let sets = [...Helper.compareSelfSets];
      sets.forEach(function(set){
          set.charts.forEach(function(c){
              delete c.percent; // Put chart in loading state.
          })
      });

      const data1 = await Helper.updateExpertChart(user, user, Helper.lastMonth, 0, sets);

      const data2 = await Helper.updateExpertChart(user, user, Helper.allTime, 1, sets);

      this.props.updateLoaderCount();

      this.setState({
        ...this.state.pieChartState,
        ...data2
      }, () => {
        console.log('Helper.compareSelfSets : ',Helper.compareSelfSets);
      });
    } catch(e) {
      this.props.updateLoaderCount();
    }
  }

  async componentDidMount() {
    await this.getPersonalComparisonCharts();
  }

  componentWillUnmount() {
    this.setState({
      pieChartState: [...Helper.compareSelfSets]
    });
  }

  ionViewDidLeave() {
    this.setState({
      pieChartState: [...Helper.compareSelfSets]
    });
  }

  getHeaders() {
    return [
      'Completed',
      'Last 4 Weeks',
      'All Time'
    ];
  }

  render() {

    return (
      <ComparisonCard
        headers={this.getHeaders()}
        pieChartData={this.state.pieChartState}
      />
    );
  }
}

export default withIonLifeCycle(ComparisonCharts);
