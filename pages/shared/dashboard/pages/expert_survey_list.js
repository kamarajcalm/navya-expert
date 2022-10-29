import Dashboard from 'material-table-ui/Dashboard';
import {
  getDateString, renderColInOrdrFrmAPIOrLocalCache,
  setColumnOrderInLocalCache, toFormattedHHMMSS } from 'material-table-ui/utils.js';
import { isSmallScreen } from '../../../../utils';
import React from "react";
import {IonLoading} from '@ionic/react';
import api from "../../../../api/endpoints";
import { getLocalDateForDashboard, getLocalTimeForDashboard, addZeroPrefix } from '../../../../utils';
import { isMSKCC } from '../../../../referrers';
import CustomHeader from './custom_header';

class ExpertSurveyListDashboard extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = { dict_mapped_data: {}, columns: [], sub_header: null, loading: false };
    }

    customDateFilter = async (startDate, endDate) => {
        await this.setMappedData(startDate, endDate);
    };

    getColumnsToRender = (dataColumns) => {

      const updatedCols = [];

      const getTurnaroundDisplayFrmTimestmp = (data) => {
        const turnaround = data.turnaround;
        if (isNaN(turnaround)) return turnaround;
        return toFormattedHHMMSS(turnaround);
      }

      const getRespondedDateTimeFrmTimeStmp = (data) => {
        let respondedDateTime = data.responded_datetime;
        if (!!!respondedDateTime) return 'N/A';
        respondedDateTime = respondedDateTime * 1 * 1000;
        let date = new Date(respondedDateTime);
        const day = date.getDate();
        const month = date.toLocaleDateString(undefined, {month: "short"});
        const year = date.getFullYear();
        const hours = addZeroPrefix(date.getHours());
        const minutes = addZeroPrefix(date.getMinutes());
        return `${month} ${day}, ${year}  ${hours}:${minutes}`;
      }

      const getTimeTakenToRespondFrmTimeStmp = (data) => {
        const timeTakenToRespond = data.time_taken_to_respond;
        if (isNaN(timeTakenToRespond)) return timeTakenToRespond;
        if(timeTakenToRespond == 0) return "-";
        return toFormattedHHMMSS(timeTakenToRespond);
      }

        const getDurationFrmTimeStmp = (data) => {
            const duration = data.duration;
            if (isNaN(duration)) return duration;
            if(duration == 0) return "-";
            return toFormattedHHMMSS(duration);
        }

        const sept_1_2020 = new Date(2020, 8, 1)
        const getReadDurationFrmTimeStmp = (data) => {
          if (data.sent_datetime < sept_1_2020 || data.status === "Pending"){
            return '-'
          }
          const duration = data.read_duration;
          if (isNaN(duration)) return duration;
          if(duration === 0) return "0s";
          return toFormattedHHMMSS(duration);
        }
        const getWriteDurationFrmTimeStmp = (data) => {
          if (data.sent_datetime < sept_1_2020 || data.status === "Pending"){
            return '-'
          }
          const duration = data.write_duration;
          if (isNaN(duration)) return duration;
          if(duration === 0) return "0s";
          return toFormattedHHMMSS(duration);
        }

      const columnsToSort = {
        'turnaround':  getTurnaroundDisplayFrmTimestmp,
        'time_taken_to_respond': getTimeTakenToRespondFrmTimeStmp,
        'duration': getDurationFrmTimeStmp,
        'read_duration': getReadDurationFrmTimeStmp,
        'write_duration': getWriteDurationFrmTimeStmp
      };


      dataColumns.map(col => {
        if (columnsToSort[col.field]) {
          col.render = columnsToSort[col.field];
        }
        if(col.field === 'id') {
          col.render = (rowData) => {
            if (rowData.navya_explanation_link){
              return <a href={rowData.navya_explanation_link} className="dashboard-link" target="_blank">{rowData.id}</a>
            } else{
              return rowData.id
            }
          }
        }
        updatedCols.push({...col});
      })

      return updatedCols;

    }

    async setMappedData(startDate=null, endDate=null) {
        let payload = {};
        if(startDate) {
            payload['start_date'] = getDateString(startDate);
        }
        if(endDate) {
            payload['end_date'] = getDateString(endDate);
        }
        this.setState({ loading: true }, async () => {
            const expertTaskListData = await api.getExpertSurveyListDashboard(payload);
            if (!expertTaskListData || expertTaskListData.error) {
                this.setState({loading: false});
                return;
            }
            let columns = expertTaskListData && expertTaskListData.data.columns;
            const data = expertTaskListData && expertTaskListData.data.result;
            const customSubHeader = expertTaskListData && expertTaskListData.data.custom_sub_header;
            let dataColumns = renderColInOrdrFrmAPIOrLocalCache(columns, "surveyDashboardColumnOrderHash");
            dataColumns = this.getColumnsToRender(dataColumns);
            if (data) {
                for (let i = 0; i < data.length; i++) {
                    if ('sent_date' in data[i] && data[i]['sent_date']) {
                      data[i]['sent_datetime'] = new Date(`${data[i]['sent_date'].trim().replace(' ','T')}.000Z`);
                    }
                    if ('responded_date' in data[i] && data[i]['responded_date']) {
                        data[i]['responded_date'] = getLocalDateForDashboard(data[i]['responded_date']);
                    }
                    if ('responded_time' in data[i] && data[i]['responded_time']) {
                        data[i]['responded_time'] = getLocalTimeForDashboard(data[i]['responded_time']);
                    }
                }
            }
            this.setState({start_date: startDate, end_date: endDate, dict_mapped_data: data, columns: dataColumns, sub_header: customSubHeader, loading: false})
        })
    }

    componentDidMount() {
        let date = new Date(), y = date.getFullYear(), m = date.getMonth(), d = date.getDate();
        let startDate = isMSKCC() ? new Date(2020, 5, 25) : new Date(2020, 8, 1);
        let endDate = new Date(y, m, d);
        this.setState({
            start_date: startDate,
            end_date: endDate,
            loading: true
        }, () => {
            this.customDateFilter(startDate, endDate);
        })
    }

    onColumnDragged = (sourceIndex, destinationIndex) => {
      setColumnOrderInLocalCache(this.state.columns, "surveyDashboardColumnOrderHash");
    }

    render() {

        const isMobile = isSmallScreen();

        return (
            <React.Fragment>
                {!this.state.loading && <Dashboard
                    title=" "
                    dict_mapped_data={this.state.dict_mapped_data || {}}
                    datefilter={true}
                    custom_datefilter={true}
                    clearFilter={false}
                    custom_datefilter_function={this.customDateFilter}
                    defaultStartDate={this.state.start_date}
                    startMinDate={isMSKCC() ? new Date(2020, 5, 25) : new Date(2020, 8, 1)}
                    defaultEndDate={this.state.end_date}
                    columns={this.state.columns || {}}
                    exportButton={false}
                    bottomMargin={isMSKCC() ? 0 : 45}
                    pageSize={isMSKCC() ? this.state.dict_mapped_data.length : 50}
                    custom_card_footer_component={this.state.sub_header && <CustomHeader header={this.state.sub_header}/>}
                    searchFieldAlignment={Object.assign({} , isMobile ? {
                      searchFieldAlignment: 'left',
                      searchFieldStyle: {marginLeft: '-16px', width: '200px'},
                    } : null)}
                    filtering={!isMobile}
                    grouping={!isMobile}
                    onColumnDragged={this.onColumnDragged}
                    components={isMSKCC() ? {
                        Pagination: props => (
                            <div/>
                        )
                    } : {}}
                />}
                <IonLoading isOpen={this.state.loading  } />
            </React.Fragment>
        )
    }
}

export default ExpertSurveyListDashboard;
