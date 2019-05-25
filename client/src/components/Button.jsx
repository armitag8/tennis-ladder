import React, {Component} from 'react';
import '../style/Button.css';
import '../style/icono.min.css';

class Button extends Component {
    constructor(props) {
        super(props);
        this.state = {
            angle: 0
        };
    }
    
    render() {
        return (
            <div>
                <button 
                    className={this.props.loading ? "mode" : "btn"}
                    onClick={e => this.props.loading ? null : this.props.onClick(e)}
                >
                    <div
                        className={this.props.loading ? "icono-sync" : this.props.icon}
                        style={! this.props.loading ? {} : {
                            width: "35px",
                            height: "35px",
                            margin: "10px",
                            WebkitAnimation: "spin 4s linear infinite",
                            MozAnimation: "spin 4s linear infinite",
                            animation: "spin 4s linear infinite",
                        }}
                    />
                </button>
            </div>
        );
    }
}

export default Button;