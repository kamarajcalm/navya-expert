
/// HELPER CLASS FOR PARSING/PROCESSING/DISPLAYING
/// PERFORMANCE CHARTS

import api from '../../../../api/endpoints';
import DMGHelper from './DMGDataSet';
import { isAccessHope } from '../../../../referrers';

class Helper {

  static allTime = {
    name: 'All Time',
    value: 'total',
    days: null
  }

  static lastMonth = {
    name: 'Last 4 Weeks',
    value: 'month',
    days: 30
  }

  static grey = '#C8C8C8'

  static pieColors = [
    [isAccessHope()?'#00DEF5':'#72c8cd', Helper.grey],
    [isAccessHope()?'#0072CE':'#193F90', Helper.grey],
    [isAccessHope()?'#EC008C':'#B45A9F', Helper.grey]
  ]

  static pieSetColors = [isAccessHope()?'#00DEF5':'#72c8cd',isAccessHope()?'#0072CE':'#193F90', isAccessHope()?'#EC008C':'#B45A9F']

  static days = 30;

  static barChart = null;

  static statKeys = ['24hrs', '<48hrs', '<72hrs', '>72hrs']

  static metricKeys = ['24hrs', '<48hrs', '<72hrs', '>72hrs', 'Total', 'pendingTotal', 'pendingxdays'];

  static compareSets = [
    {
        label: 'On Time',
        charts: Helper.emptyCharts(isAccessHope()?'#00DEF5':'#72c8cd')
    },
    {
        label: 'Delayed',
        charts: Helper.emptyCharts(isAccessHope()?'#0072CE':'#193F90')
    },
    {
        label: 'Total',
        charts: Helper.emptyCharts(isAccessHope()?'#EC008C':'#B45A9F')
    }
  ]

  static compareSelfSets = [
    {
        label: 'On Time',
        charts: Helper.emptyCharts(isAccessHope()?'#00DEF5':'#72c8cd')
    },
    {
        label: 'Delayed',
        charts: Helper.emptyCharts(isAccessHope()?'#0072CE':'#193F90')
    },
    {
        label: 'Total',
        charts: Helper.emptyCharts(isAccessHope()?'#EC008C':'#B45A9F')
    }
  ]

  static defaultComparisonSets = () => {

    const compareToSets = [
      {
          id: 'institution',
          name: 'Institution',
          label: 'Institution',
          method: 'getExpertTotalInOrg',
          data: {}
      },
      {
          id: 'specialty',
          name: 'Specialty',
          label: 'Specialty',
          method: 'getExpertSpecialty',
          data: {}
      }
    ];

    return {

      compare: {
        expert: compareToSets[0],
        time: Helper.allTime
      },

      compareToSets,

      compareSets: Helper.compareSets,

      user: {
            id: 'you',
            name: 'You',
            label: 'You',
            value(days, expert) {
                if (expert && expert.dmg) {
                    return api.getDMG(days)
                        .then(DMGHelper.parseDMGResponseFor(expert.dmg))
                }
                return api.getExpertTotal(days);
            }
      }
    };
  }

  static barOptions() {
    return {
      chart: {
        groupSpacing: .5,
        // dispatch: {
        //     renderEnd: function(e, scope){
        //         placeLabelsAfterTransition();
        //         console.log('renderEnd', e, scope)
        //     }
        // },
        type: 'multiBarHorizontalChart',
        height: 130,
        x: function(d){return d.label;},
        y: function(d){return d.value;},
        stacked: true,
        staggerLabels: true,
        tooltips: false,
        showLegend: false,
        showControls: false,
        showValues: false,
        duration: 500,
        showYAxis: false,
        margin : {
            top: 0,
            bottom: 0,
            right: 50,
            left: 50
        },
        valuePadding: 10,
        xAxis: {
        }
      }
    };
  }

  static pieOptions() {
    return {
      chart: {
          showLegend: false,
          type: 'pieChart',
          height: 45,
          // width: 45,
          donut: true,
          x: function(d){return d.key;},
          y: function(d){return d.y;},
          showLabels: false,
          duration: 500,
          margin: {
              left: 0,
              top: 0,
              right: 0,
              bottom: 0
          }
      }
    };
  }

  static nullChart(color) {
      return {
          data: [
              {
                  key: 0,
                  y: 0,
                  color: color
              },
              {
                  key: 1,
                  y: 1,
                  color: Helper.grey
              }
          ]
      };
  }

  static emptyCharts(color) {
    return [Helper.nullChart(color), Helper.nullChart(color)]
  }

  static createComparisonChartSet(val, i) {
    return {
        data: [
            {
                key: 0,
                y: val,
                color: Helper.pieSetColors[i]
            },
            {
                key: 1,
                y: 1 - val,
                color: Helper.grey
            }
        ],
        percent: (val*100).toFixed(1) + '%'
    };
  }

  static processData(res) {
      var data = res || {};
      if (data instanceof Array) {
          data = data[0] || {};
      }
      Helper.metricKeys.forEach(function(key){
          data[key] = Number(data[key]) || 0;
      });
      return data;
  }

  static parseComparisonData (res) {
      var data = Helper.processData(res);
      if (!data.Total) {
          return [
            Helper.createComparisonChartSet(0,0),
            Helper.createComparisonChartSet(0,1),
            Helper.createComparisonChartSet(0,2)
          ];
      }
      return [
          data['24hrs']/data.Total,
          (data['<48hrs'] + data['<72hrs'] + data['>72hrs'])/data.Total,
          data.Total / (data.Total + (data.pendingxdays || data.pendingTotal))
      ].map(function(val, i){
          return Helper.createComparisonChartSet(val, i)
      })
  }

  static async updateExpertChart(expert, to, time, index, chartSet) {
        var request;
        if (expert.value) {
            request = expert.value(time.days, to);
        } else {
            request = api[expert.method](time.days);
        }
        return request.then(Helper.parseComparisonData)
            .then(data => {
                chartSet.forEach((s, i) => {
                    var chart = s.charts[index],
                        d = data[i];
                    chart.data = d.data;
                    chart.percent = d.percent;
                });
                return chartSet;
            })
    }

}

export default Helper;
