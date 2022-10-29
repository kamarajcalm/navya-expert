import Dashboard from 'material-table-ui/Dashboard';
import {
    getDateString, renderColInOrdrFrmAPIOrLocalCache,
    setColumnOrderInLocalCache, toFormattedHHMMSS
} from 'material-table-ui/utils.js';
import {isSmallScreen} from '../../../../utils';
import React from "react";
import {IonLoading} from '@ionic/react';
import api from "../../../../api/endpoints";
import {isMSKCC} from '../../../../referrers';
import CustomHeader from './custom_header';

class CaseAggregatedListDashboard extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {dict_mapped_data: {}, columns: [], sub_header: null, loading: false};
    }

    customDateFilter = async (startDate, endDate) => {
        await this.setMappedData(startDate, endDate);
    };

    getColumnsToRender = (dataColumns) => {
        const updatedCols = [];
        const getTotalTimeSpentDisplayFrmTimestmp = (data) => {
            const total_time_spent = data.total_time_spent;
            if (isNaN(total_time_spent)) return total_time_spent;
            if(total_time_spent == 0) return "-";
            return toFormattedHHMMSS(total_time_spent);
        }
        const columnsToSort = {
            'total_time_spent': getTotalTimeSpentDisplayFrmTimestmp
        };
        dataColumns.map(col => {
            if (columnsToSort[col.field]) {
                col.render = columnsToSort[col.field];
            }
            updatedCols.push({...col});
        })
        return updatedCols;
    }

    async setMappedData(startDate = null, endDate = null) {
        let payload = {};
        if(startDate) {
            payload['start_date'] = getDateString(startDate);
        }
        if(endDate) {
            payload['end_date'] = getDateString(endDate);
        }
        this.setState({ loading: true }, async () => {
          const caseAggregatedData = await api.getCaseAggregatedListDashboard(payload);
          if (!caseAggregatedData || caseAggregatedData.error) {
              this.setState({loading: false});
              return;
          }
          let columns = caseAggregatedData && caseAggregatedData.data.columns;
          const data = caseAggregatedData && caseAggregatedData.data.result;
          let dataColumns = renderColInOrdrFrmAPIOrLocalCache(columns, "caseAggregatedColumnOrderHash");
          dataColumns = this.getColumnsToRender(dataColumns);
          this.setState({start_date: startDate, end_date: endDate, dict_mapped_data: data, columns: dataColumns, loading: false})
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
        setColumnOrderInLocalCache(this.state.columns, "caseAggregatedColumnOrderHash");
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
                    bottomMargin={45}
                    exportButton={false}
                    custom_card_footer_component={this.state.sub_header &&
                    <CustomHeader header={this.state.sub_header}/>}
                    searchFieldAlignment={Object.assign({}, isMobile ? {
                        searchFieldAlignment: 'left',
                        searchFieldStyle: {marginLeft: '-16px', width: '200px'},
                    } : null)}
                    filtering={!isMobile}
                    grouping={!isMobile}
                    onColumnDragged={this.onColumnDragged}
                />}
                <IonLoading isOpen={this.state.loading}/>
            </React.Fragment>
        )
    }
}

export default CaseAggregatedListDashboard;
