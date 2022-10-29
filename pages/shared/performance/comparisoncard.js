
import React from 'react';
import {
  IonGrid, IonRow, IonCol,
  IonCard, IonCardHeader, IonCardContent, IonSpinner
} from '@ionic/react';
import Helper from './helpers';
import NVD3Chart from 'react-nvd3';

const ComparisonCard = ({ headers=[], pieChartData=[] }) => (

    <IonCard className="card pie-charts-card-container" style={{margin: '10px', 'backgroundColor': '#FAFAFA', 'border': '1px solid #C8C8C8'}}>
      <IonGrid>
        <IonCardHeader>
            <IonRow style={{fontWeight: 'bold', fontSize: '13px'}} >
              { headers.map((title, index) => ( <IonCol size="4" key={`${title}_${index}`}>{title}</IonCol> )) }
            </IonRow>
        </IonCardHeader>
        <IonCardContent>
        {
          pieChartData.map((set, index) => (
            <IonRow style={{fontWeight: '400'}}  key={`personal_${index}_comparison`} className="pie-chart-row">
                <IonCol size="4" className="col">{set.label}</IonCol>
                {
                  set.charts.map((chart, index) => (
                    <IonCol className="pie-section" key={`personal_set_${index}_comparison`} className="col">
                        <NVD3Chart align-self-center {...Helper.pieOptions().chart} datum={chart.data} />
                        <div className="spinner-section">
                            {
                              !!!chart.percent &&
                              <IonSpinner icon="spiral" name="crescent" className="chart-loading-spinner" />
                            }
                            {chart && chart.percent}
                        </div>
                    </IonCol>
                  ))
                }
            </IonRow>
          ))
        }
        </IonCardContent>
      </IonGrid>
    </IonCard>

);

export default ComparisonCard;
