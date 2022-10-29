import Card from "material-table-ui/components/Card/Card.jsx";
import CardBody from "material-table-ui/components/Card/CardBody.jsx";
import GridContainer from "material-table-ui/components/Grid/GridContainer.jsx";
import GridItem from "material-table-ui/components/Grid/GridItem.jsx";
import Dashboard from 'material-table-ui/Dashboard';
import SimpleDashboard from 'material-table-ui/SimpleDashboard';
import { getDateString, toFormattedHHMMSS } from 'material-table-ui/utils.js';
import React from "react";
import {DatePicker, MuiPickersUtilsProvider} from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import Button from "@material-ui/core/Button";
import NativeSelect from "@material-ui/core/NativeSelect";
import { isSmallScreen } from '../../../../utils';
import api from "../../../../api/endpoints";
import {IonLoading} from '@ionic/react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Label, ResponsiveContainer
} from 'recharts';

class HospitalSummaryDashboardMSKCC extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {expertList: null, isExpertListLoaded: false, selected_expert_id: null, show_individual_expert_data: false, startDate: null, endDate: null, noData: false, dict_mapped_data: {}, columns: [], message: null, isLoading: false, isLoaded: false};
    }

    async getExpertListByOrg() {
      let expert_list = await api.getExpertListByOrg({org: 'mskcc'});
      let data = expert_list && expert_list.data;
      console.log(data)
      this.setState({expertList: data, isExpertListLoaded: true})
    }

    formatTableData(table) {
      let specialFormatting = {}

      if (!(table.columns && table.result)){
        return table;
      }

      for (let i = 0; i < table.columns.length; i++){
        if (table.columns[i].formatting) {
          specialFormatting[table.columns[i].field] = table.columns[i].formatting
        }
        if (table.columns[i].title.includes("Percent")) {
          table.columns[i].title = '';
        }
      }

      table.result = table.result.map((row) => {
        Object.keys(row).forEach((key) => {
          if (specialFormatting[key]) {
            if (!Number.isFinite(row[key])){
              return;
            }
            if (specialFormatting[key] === "percent"){
              row[key] = (row[key]*100).toFixed(1) + '%';
            }
            else if (specialFormatting[key] === "hhmmss"){
              row[key] = toFormattedHHMMSS(row[key]);
            }
          }
        });
        return row;
      })

      return table;

    }

    async setMappedData(startDate, endDate) {
      let payload = {
        "start_date": startDate,
        "end_date": endDate
      };

      let show_individual_expert_data = false;

      if (this.state.selected_expert_id){
        payload["expert_id"] = this.state.selected_expert_id;
        show_individual_expert_data = true;
      }

      this.setState({ isLoading: true, isLoaded: false }, async () => {
        const responseData = await api.getHospitalSummaryDashboard(payload);
        let caseAggregatedData = responseData.data.aggregate_data;

        let noData = false;

        if (caseAggregatedData.response_times){
          // caseAggregatedData.response_times.columns[0].title = "M-F 8am-5pm";
          this.formatTableData(caseAggregatedData.response_times);
          this.setState({response_times: caseAggregatedData.response_times});
        }

        if (caseAggregatedData.device){
          // caseAggregatedData.device.columns[2].title = "Web App";
          this.formatTableData(caseAggregatedData.device);
          this.setState({device: caseAggregatedData.device});
        }

        if (caseAggregatedData.attachments){
          this.formatTableData(caseAggregatedData.attachments);
          this.setState({attachments: caseAggregatedData.attachments});
        }

        console.log("No Data")

        if (caseAggregatedData.response_duration){
          console.log(caseAggregatedData.response_duration.result[0].total_duration)
          if (caseAggregatedData.response_duration.result && caseAggregatedData.response_duration.result[0]){
            if (caseAggregatedData.response_duration.result[0].total_duration === 0){
              noData = true;
            }
          }          this.formatTableData(caseAggregatedData.response_duration);
          this.setState({response_duration: caseAggregatedData.response_duration});
        } else {
          noData = true;
        }

        console.log(noData)

        if (caseAggregatedData.prospective_trial_tables){
          caseAggregatedData.prospective_trial_tables.map((table) => { return this.formatTableData(table) });
          this.setState({prospective_trial_tables: caseAggregatedData.prospective_trial_tables});
        }

        if (responseData.data.individual_survey_timings_graph){
          this.setState({individual_survey_timings_graph: responseData.data.individual_survey_timings_graph});
        }

        this.setState({start_date: startDate, end_date: endDate, show_individual_expert_data: show_individual_expert_data, noData: noData, isLoading: false, isLoaded: true})

      })
    }

    filterData = async () => {
      let startDate;
      let endDate;
      try {
        startDate = getDateString(this.state.startDate);
        endDate = getDateString(this.state.endDate);
      } catch(error) {
        alert('Select start and end dates');
        return;
      }
      await this.setMappedData(startDate, endDate);
    };

    setExpert = (event) => {
      let selected_expert_id = event.target.value;
      if (selected_expert_id < 0){
        selected_expert_id = null;
      }
      console.log(selected_expert_id)
      this.setState({selected_expert_id: selected_expert_id})
    };

    async componentDidMount() {
        await this.getExpertListByOrg()
        let date = new Date(), y = date.getFullYear(), m = date.getMonth(), d = date.getDate();
        let startDate = new Date(2020, 5, 25);
        // let startDate = new Date(2020, 1, 1);
        let endDate = new Date(y, m, d);

        this.setState({
            startDate: startDate,
            endDate: endDate,
            isLoading: true
        }, () => {
            this.filterData();
        })
    }

    render() {
      return (
        <GridContainer>
          {
            this.state.isExpertListLoaded && <GridItem xs={12} sm={12} md={12}>
              <Card className="card-container">
                <CardBody className="filter-card-body">
                  <GridContainer>
                    <div className="double-width">
                      <GridItem className="double-width">
                        <NativeSelect onChange={this.setExpert}>
                          <option value={-1}>All Experts</option>
                          {
                            this.state.expertList.map((item) => (
                                <option value={item.expert_id}>{item.name}</option>
                              )
                            )}
                        </NativeSelect>
                      </GridItem>
                    </div>
                    <GridItem xs={12} sm={6} md={2}>
                      <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <DatePicker value={this.state.startDate || null} format="yyyy-MM-dd"
                                    minDate={new Date(2020, 5, 25)}
                                    onChange={(date) => {
                                      this.setState({startDate: date})
                                    }}/>
                      </ MuiPickersUtilsProvider>
                    </GridItem>
                    <GridItem xs={12} sm={6} md={2}>
                      <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <DatePicker value={this.state.endDate || null} format="yyyy-MM-dd"
                                    onChange={(date) => {
                                      this.setState({endDate: date})
                                    }}/>
                      </ MuiPickersUtilsProvider>
                    </GridItem>
                    <GridItem xs={12} sm={6} md={2}>
                      <Button className='date-filter' onClick={this.filterData}>
                        <span>Filter</span>
                      </Button>
                    </GridItem>
                    <GridItem xs={12} sm={12} md={4}>
                      <h4>
                        {this.state.message}
                      </h4>
                    </GridItem>
                  </GridContainer>
                </CardBody>
              </Card>
            </GridItem>
          }
          {
            <div className="mskcc-summary-dashboard-data-section">
            <GridContainer>
              {
                this.state.isLoaded && this.state.noData &&
                <GridItem xs={12} sm={12} md={12} lg={12} xl={12}>
                  <CardBody className="card-body">
                    <div style={{margin: "5px 0px"}}>
                    <p>There are no responded surveys for the dates and expert(s) selected.</p>
                    </div>
                  </CardBody>
                </GridItem>
              }
              {
                this.state.isLoaded && !this.state.noData && this.state.response_duration && <SimpleDashboard
                  title="Response Time Taken"
                  md={6} lg={4} xl={4}
                  dict_mapped_data={this.state.response_duration.result || {}}
                  columns={this.state.response_duration.columns || {}}
                />
              }
              {
                this.state.isLoaded && !this.state.noData && this.state.response_times && <SimpleDashboard
                  title="Responses During Work Hours vs. Other Hours"
                  md={6} lg={4} xl={4}
                  dict_mapped_data={this.state.response_times.result || {}}
                  columns={this.state.response_times.columns || {}}
                />
              }
              {
                this.state.isLoaded && !this.state.noData && this.state.device && <SimpleDashboard
                  title="Responses On Mobile App vs. Web App"
                  md={6} lg={4} xl={4}
                  dict_mapped_data={this.state.device.result || {}}
                  columns={this.state.device.columns || {}}
                />
              }
              {
                this.state.isLoaded && !this.state.noData && this.state.prospective_trial_tables.map ((item) => <SimpleDashboard
                  title={item.title}
                  md={6} lg={4} xl={4}
                  dict_mapped_data={item.result || {}}
                  columns={item.columns || {}}
                />
              )
              }
              { /*
                this.state.isLoaded && !this.state.noData && this.state.attachments && <SimpleDashboard
                  title="Attachment Time Taken"
                  dict_mapped_data={this.state.attachments.result || {}}
                  columns={this.state.attachments.columns || {}}
                />
              */ }
              {
                this.state.isLoaded && !this.state.noData &&
                <GridItem xs={12} sm={12} md={12} lg={12} xl={12}>
                  <CardBody className="card-body">
                    <div style={{margin: "0px 10px"}}>
                    <p>(*) Data calculated for surveys sent beginning on September 1, 2020, when detailed time tracking was released.</p>
                    </div>
                  </CardBody>
                </GridItem>
              }
              {
                this.state.isLoaded && !this.state.noData && this.state.individual_survey_timings_graph && this.state.show_individual_expert_data &&
                <GridItem xs={12} sm={12} md={12} lg={8} xl={6}>
                <CardBody className="card-body"><Card style={{marginTop: 0, boxShadow: "0px 3px 1px -2px rgb(0 0 0 / 20%), 0px 2px 2px 0px rgb(0 0 0 / 14%), 0px 1px 5px 0px rgb(0 0 0 / 12%)"}}>
                  <h6 class="MuiToolbar-root MuiToolbar-regular MuiToolbar-gutters MuiTypography-root MuiTypography-h6">Response Times by Survey</h6>
                  <ResponsiveContainer width="100%" aspect={2}>
                    <BarChart
                      data={this.state.individual_survey_timings_graph}
                      margin={{
                        top: 15, right: 15, left: 15, bottom: 35,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" label={{ value: 'Surveys', position: 'bottom' }} />
                      <YAxis allowDecimals={false} >
                        <Label value='Total Time (Minutes)' angle={-90} />
                      </YAxis>
                      <Bar dataKey="time" fill="#0968C3" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card></CardBody>
                </GridItem>
            }
            <IonLoading isOpen={this.state.isLoading} />
            </GridContainer>
            </div>
          }
        </GridContainer>
      )
    }
}

export default HospitalSummaryDashboardMSKCC;
