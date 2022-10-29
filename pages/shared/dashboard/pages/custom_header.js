import React from "react";

class CustomHeader extends React.PureComponent {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="dashboard-footer" style={{'marginTop': '10px'}}>
                {this.props.header.title && <dt><b>{this.props.header.title}</b></dt>}
                {this.props.header.list && this.props.header.list.map((value, index) => {
                    return <dd>{value}</dd>
                })}
            </div>
        )
    }
}

export default CustomHeader;
