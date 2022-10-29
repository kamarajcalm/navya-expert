import Dashboard from 'material-table-ui/Dashboard';
import React from "react";
import { isSmallScreen } from '../../../../utils';
import api from "../../../../api/endpoints";
import { toFormattedHHMMSS, renderColInOrdrFrmAPIOrLocalCache, setColumnOrderInLocalCache, getDateString } from 'material-table-ui/utils.js';
import {IonLoading} from '@ionic/react';

class ExpertListDashboardMSKCC extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = { dict_mapped_data: {}, columns: [], loading: false };
    }

    customDateFilter = async (startDate, endDate) => {
        await this.setMappedData(startDate, endDate);
    };

    getColumnsToRender = (dataColumns) => {
      const updatedCols = [];
      const getResponsePercent = (data) => {
          if(data.length == 0) return '';
        return `${data.response_count} / ${data.sent_count}`;
      }
      const getAverageTimeTaken = (data) => {
        const avgTimeTaken = data.average_time_taken
          if(avgTimeTaken == 0) return "-";
        return toFormattedHHMMSS(avgTimeTaken);
      }

      const columnsToSort = {
        'average_time_taken': getAverageTimeTaken
      };

      const columnsNotToSort = {
        'response_percent': getResponsePercent
      }

      dataColumns.map(col => {
        if (columnsToSort[col.field]) {
          col.render = columnsToSort[col.field];
        } else if (columnsNotToSort[col.field]) {
          col.render = columnsNotToSort[col.field];
          col.sorting = false;
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
            const expertTaskListData = await api.getExpertsDashboard(payload);
            let columns = expertTaskListData && expertTaskListData.data.columns;
            const data = expertTaskListData && expertTaskListData.data.result;
            if (!expertTaskListData || expertTaskListData.error) {
                this.setState({loading: false});
                return;
            }
            let dataColumns = renderColInOrdrFrmAPIOrLocalCache(columns, "expertsDashboardColumnOrderHash");
            dataColumns = this.getColumnsToRender(dataColumns);
            this.setState({start_date: startDate, end_date: endDate, dict_mapped_data: data, columns: dataColumns, loading: false})
        })
    }

    componentDidMount() {
        let date = new Date(), y = date.getFullYear(), m = date.getMonth(), d = date.getDate();
        let startDate = new Date(2020, 5, 25);
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
        setColumnOrderInLocalCache(this.state.columns, "expertsDashboardColumnOrderHash");
    }

    render() {

        const isMobile = isSmallScreen();
        return (
            <React.Fragment>
                <div>
                    {!this.state.loading && <Dashboard
                        title=" "
                        dict_mapped_data={this.state.dict_mapped_data || {}}
                        columns={this.state.columns || {}}
                        datefilter={true}
                        custom_datefilter={true}
                        clearFilter={false}
                        custom_datefilter_function={this.customDateFilter}
                        defaultStartDate={this.state.start_date}
                        startMinDate={new Date(2020, 5, 25)}
                        defaultEndDate={this.state.end_date}
                        exportButton={false}
                        pageSize={this.state.dict_mapped_data.length}
                        searchFieldAlignment={Object.assign({} , isMobile ? {
                            searchFieldAlignment: 'left',
                            searchFieldStyle: {marginLeft: '-16px', width: '200px'},
                        } : null)}
                        filtering={!isMobile}
                        grouping={!isMobile}
                        components={{
                            Pagination: props => (
                                <div/>
                            )
                        }}
                        onColumnDragged={this.onColumnDragged}
                    />}
                    <IonLoading isOpen={this.state.loading} />
                </div>
            </React.Fragment>
        )
    }
}

export default ExpertListDashboardMSKCC;
