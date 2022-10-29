
import React from 'react';
import {
  IonItem, IonLabel, IonLoading
} from '@ionic/react';
import api from '../../../../api/endpoints';
import Helper from '../helpers';
import DMGDataSetHelper from '../helpers/DMGDataSet';
import ComparisonCard from '../comparisoncard';
import './styles.scss';

class Comparison extends React.PureComponent {

  constructor(props) {
    super(props);
    this.defaultComparisonSets = Helper.defaultComparisonSets();
    const timeOptions = [ Helper.allTime, Helper.lastMonth ];
    const compare = this.defaultComparisonSets.compare;
    this.defaultPieChartState = this.getDefaultPieChartState();
    this.compareLabels = { from: 'You', to: compare.expert.label };
    this.state = {
      compareToSets: this.defaultComparisonSets.compareToSets,
      compareSets: this.defaultComparisonSets.compareSets,
      pieChartState: this.defaultPieChartState,
      compare,
      timeOptions,
      showLoading: false
    };
  }

  getDefaultPieChartState = () => {
    return [
      {
          label: 'On Time',
          charts: Helper.emptyCharts('#72c8cd')
      },
      {
          label: 'Delayed',
          charts: Helper.emptyCharts('#193F90')
      },
      {
          label: 'Total',
          charts: Helper.emptyCharts('#B45A9F')
      }
    ];
  }

  componentDidMount() {
    this.setState({
      pieChartState: this.defaultPieChartState,
      showLoading: true
    }, async () => {
      try {
        const dmgResponse = await api.getDMG();
        this.setState({
          showLoading: false
        }, () => {
          const data = DMGDataSetHelper.parseDMGResponse(dmgResponse);
          this.addToCompareSet(data);
        })
      } catch(e) {
        this.setState({
          showLoading: false
        })
      }
    })
  }

  addToCompareSet(data) {
    const newCompareSet = [];
    data.forEach(function(dmg){
        var aff = dmg.subaffiliation1 || dmg.Subaffiliation1 || dmg.experience,
            name = DMGDataSetHelper.normalizeDMGName(aff),
            set = {
                id: 'dmg:' + dmg.experience_value,
                name: name,
                label: 'DMG',
                dmg: aff,
                experience_value: dmg.experience_value,
                value(days) {
                    var parse = DMGDataSetHelper.parseDMGResponseFor(name)
                    return api.getDMGOrg(days)
                        .then(parse.bind(this))
                },
                data: {}
            };
        newCompareSet.push(set);
    });

    this.setState({
      compareToSets: [
        ...this.state.compareToSets,
        ...newCompareSet
      ]
    }, async () => {
      await this.updateComparisonCharts();
    });
  }

  changedTimeRange = e => {
    this.setState({
      compare: {
        ...this.state.compare,
        ...{time: this.state.timeOptions[e.target.value*1]}
      },
      pieChartState: this.defaultPieChartState
    }, async () => {
      await this.updateComparisonCharts();
    });
  }

  changedExpert = e => {

    this.setState({
      compare: {
        ...this.state.compare,
        ...{ expert: {...this.state.compareToSets[e.target.value*1]} }
      },
      pieChartState: this.defaultPieChartState
    }, async () => {
      await this.updateComparisonCharts();
    });
  }

  async updateComparisonCharts() {
    const user = this.defaultComparisonSets.user;

    const {
      compare: { expert, time }, compareSets: sets
    } = this.state;

    this.compareLabels.to = expert.label;

    // Put each chart in loading state
    // while we fetch new data.
    sets.forEach(function(set){
        set.charts.forEach(function(c){
            delete c.percent;
        })
    });

    try {
      const data1 = await Helper.updateExpertChart(user, expert, time, 0, sets);

      const data2 = await Helper.updateExpertChart(expert, user, time, 1, sets);

      this.setState({
        pieChartState: [ ...data2 ],
        showLoading: false
      });
    } catch(e) {
      console.log(e.message);
      this.setState({
        showLoading: false
      });
    }



  }

  getHeaders() {
    return [
      'Completed',
      this.compareLabels.from,
      this.compareLabels.to
    ];
  }

  render() {
    return(
      <React.Fragment>
        <form className="comparison-container">
            <IonItem className="item item-select">
                <IonLabel className="input-label">
                  <span>Compare to</span>
                  <select name="Choice" onChange={this.changedExpert}>
                    {
                      this.state.compareToSets.map((set, index) => (
                        <option key={`${set.id}_${index}`} value={index} >{set.name}</option>
                      ))
                    }
                  </select>
                </IonLabel>
            </IonItem>
            <IonItem className="item item-select">
                <IonLabel className="input-label">
                  <span>From</span>
                  <select name="Time" onChange={this.changedTimeRange}>
                  {
                    this.state.timeOptions.map((time, index) => (
                      <option key={`${index}_${time.value}_${time.name}`} value={index}>{time.name}</option>
                    ))
                  }
                  </select>
                </IonLabel>
            </IonItem>
        </form>
        <ComparisonCard
          headers={this.getHeaders()}
          pieChartData={this.state.pieChartState}
        />
        <IonLoading isOpen={this.state.showLoading} />
      </React.Fragment>
    );
  }
}

export default Comparison;
