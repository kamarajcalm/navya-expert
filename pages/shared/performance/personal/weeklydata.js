
// Update the weekly bar graph data for the
// expert's performance. A fair amount of
// ugly math is going on here as we parse
// data sets and calculate the difference
// between each week to get that week's totals.

import React from 'react';
import { withIonLifeCycle } from '@ionic/react';
import Helper from '../helpers';
import api from '../../../../api/endpoints';
import NVD3Chart from 'react-nvd3';
import './styles.scss'

class WeeklyData extends React.PureComponent {

  constructor(props) {
    super(props);
    this.weeklyData = {};
    this.fetched = 0;
    this.mounted = null;
    this.state = {
      barOptions: null,
      weeklyBarData: null,
      weeklyBarValues: null
    }
  }

  subtractData(data, from) {
    from.total -= data.total;
    from.onTime -= data.onTime;
    from.overdue -= data.overdue;
  }

  onFetched() {
    this.fetched++;
    if (this.fetched !== 4) { return; }
    // if (promise) promise.resolve();

    let data;

    for (let key in this.weeklyData) {
        data = this.weeklyData[key];
        data.total = data.Total;
        data.onTime = data['24hrs'];
        data.overdue = data.total - data.onTime;
    }

    this.subtractData(this.weeklyData[21], this.weeklyData[28])
    this.subtractData(this.weeklyData[14], this.weeklyData[21])
    this.subtractData(this.weeklyData[7], this.weeklyData[14])
    let range = 5;
    let values = [0,1,2,3].map(i => {
        let label = 'w' + (i+1);
        let daysAgo = 28 - (7*i);
        let d = this.weeklyData[daysAgo];
        range = Math.max(d.total, range);
        return { label: label, data: d };
    });
    let barOptions = Helper.barOptions();
    barOptions.chart.forceY = [0, range]; // ensure minimum y-range
    let weeklyBarData = values;
    // $scope.weeklyBarLabels = []; // Labels are set after render.
    let weeklyBarValues = [
        {
            key: 'On Time',
            color: '#72c8cd',
            values: values.map((v, i) => {
                return { label: v.label, value: v.data.onTime }
            })
        },
        {
            key: 'Delayed',
            color: '#193F90',
            values: values.map((v, i) => {
                return { label: v.label, value: v.data.overdue }
            })
        }
    ]

    this.setState({
      barOptions,
      weeklyBarData,
      weeklyBarValues
    });
    // placeLabelsAfterTransition();
  }

  getPersonalWeeklyData() {
    // Get expert's data for each week.
    [7, 14, 21, 28].forEach(d => {
        api.getExpertTotal(d).then(Helper.processData).then(data => {
            this.props.updateLoaderCount(+data.xe_time_in_mins);
            this.weeklyData[d] = data;
            this.onFetched();
        }).catch(e => {
          console.log(e.message);
          this.props.updateLoaderCount();
        });
    });
  }

  componentDidMount() {
    this.mounted = 1;
    this.getData();
  }

  ionViewDidEnter() {
    this.mounted = this.mounted || null;
    if (!this.mounted) {
      this.getData();
    }
  }

  ionViewDidLeave() {
    this.mounted = null;
  }

  getData() {
    this.weeklyData = {};
    this.fetched = 0;
    this.rectList = null;
    this.setState({
      showLabels: false,
      barOptions: null,
      weeklyBarData: null,
      weeklyBarValues: null
    }, () => {

      this.getPersonalWeeklyData();
    })

  }

  postChartRenderFn = () => {
    this.rectList = window.d3.selectAll('.nv-series-1 rect')[0];
    this.setState({
      showLabels: true
    })
  }

  render() {
    let counter = 1;
    return (
      <React.Fragment>
        {
          this.state.weeklyBarValues &&
          <div className="weekly-heading">
            <h2> Completed Last 4 Weeks </h2>

          <NVD3Chart
            {...this.state.barOptions.chart}
            datum={this.state.weeklyBarValues}
            renderEnd={this.postChartRenderFn}
          />

          {
            this.state.showLabels &&
            <React.Fragment>
              {

                this.state.weeklyBarData.map((item, index) => {
                  const obj = this.rectList[index];
                  const rect = obj.getBoundingClientRect();
                  const scrollTop = obj.scrollTop;
                  const multiple = counter;
                  counter += 2;
                  return (
                    <span
                      className="labels"
                      key={`bar_data_${index}`}
                      style={{
                        "position": "absolute",
                        "fontSize": '12px',
                        "left": rect.left + rect.width + (item.data.total === 0 ? 5 : 10),
                        "top": 28 + ( rect.height * multiple) - rect.height / 2 - 4,
                        "color": '#000',
                        "background": "#fff"
                      }}
                    >
                      {item.data.total}
                    </span>
                  )
                })
              }
            </React.Fragment>
          }

          </div>
        }

      </React.Fragment>
    );
  }
}

export default withIonLifeCycle(WeeklyData);
